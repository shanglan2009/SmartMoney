"""
A股供应链数据采集器 — 从东方财富免费接口获取实时数据
"""

import requests
import json
import time
from datetime import datetime
from typing import Optional

# ========== 配置 ==========

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://quote.eastmoney.com/",
}

# 市场前缀映射: SH=1, SZ=0, BJ=0
def secid(code: str) -> str:
    if code.startswith("6") or code.startswith("9"):
        return f"1.{code}"
    return f"0.{code}"


# ========== 1. 实时行情数据 ==========

def fetch_realtime_quotes(codes: list[str]) -> dict:
    """
    获取A股实时行情
    接口: push2.eastmoney.com/api/qt/ulist.np/get
    返回: {code: {name, price, change%, turnover, pe, market_cap}}
    """
    secids = ",".join(secid(c) for c in codes)
    url = "https://push2.eastmoney.com/api/qt/ulist.np/get"
    params = {
        "fltt": "2",
        "fields": "f2,f3,f4,f5,f12,f14,f15,f16,f17,f18,f20,f21",
        "secids": secids,
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        data = r.json()
        result = {}
        if data.get("data") and data["data"].get("diff"):
            for item in data["data"]["diff"]:
                code = str(item.get("f12", ""))
                result[code] = {
                    "code": code,
                    "name": item.get("f14", ""),
                    "price": item.get("f2"),
                    "change_percent": item.get("f3"),
                    "change_amount": item.get("f4"),
                    "high": item.get("f15"),
                    "low": item.get("f16"),
                    "open": item.get("f17"),
                    "volume": item.get("f5"),
                    "turnover_rate": item.get("f20"),
                    "pe": item.get("f21"),
                    "market_cap": item.get("f20"),
                }
            return result
        return {}
    except Exception as e:
        print(f"[ERROR] fetch_realtime_quotes: {e}")
        return {}


# ========== 2. 公司基本信息 ==========

def fetch_company_info(code: str) -> Optional[dict]:
    """
    获取公司基本信息
    接口: push2.eastmoney.com/api/qt/stock/get
    """
    url = "https://push2.eastmoney.com/api/qt/stock/get"
    params = {
        "fltt": "2",
        "fields": "f57,f58,f84,f85,f86,f100,f116,f117,f152",
        "secid": secid(code),
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        data = r.json()
        if data.get("data"):
            d = data["data"]
            return {
                "code": code,
                "name": d.get("f58", ""),
                "industry": d.get("f57", ""),
                "market": "SH" if code.startswith(("6", "9")) else "SZ",
                "total_market_cap": d.get("f116"),
                "circulating_market_cap": d.get("f117"),
            }
        return None
    except Exception as e:
        print(f"[ERROR] fetch_company_info({code}): {e}")
        return None


# ========== 3. 财务数据 ==========

def fetch_financial_data(code: str) -> Optional[dict]:
    """
    获取财务指标（营收、净利润、毛利率、研发费用）
    接口: datacenter.eastmoney.com
    """
    url = "https://datacenter.eastmoney.com/securities/api/data/v1/get"
    params = {
        "reportName": "RPT_LICO_FN_CPD",
        "columns": "SECUCODE,SECURITY_NAME_ABBR,TOTAL_OPERATE_INCOME,PARENT_NETPROFIT,GROSS_PROFIT_MARGIN,RESEARCH_EXPENSE",
        "filter": f'(SECUCODE="{code}.{"" if code.startswith(("6","9")) else "SZ"})"',
        "pageNumber": 1,
        "pageSize": 4,
        "sortTypes": -1,
        "sortColumns": "REPORT_DATE",
        "source": "WEB",
        "client": "WEB",
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        data = r.json()
        if data.get("result") and data["result"].get("data"):
            latest = data["result"]["data"][0]
            prev = data["result"]["data"][1] if len(data["result"]["data"]) > 1 else {}
            return {
                "code": code,
                "revenue": latest.get("TOTAL_OPERATE_INCOME"),
                "revenue_yoy": (
                    (latest["TOTAL_OPERATE_INCOME"] - prev["TOTAL_OPERATE_INCOME"]) /
                    abs(prev["TOTAL_OPERATE_INCOME"])
                    if prev.get("TOTAL_OPERATE_INCOME") and latest.get("TOTAL_OPERATE_INCOME")
                    and prev["TOTAL_OPERATE_INCOME"] != 0
                    else None
                ),
                "net_profit": latest.get("PARENT_NETPROFIT"),
                "gross_margin": latest.get("GROSS_PROFIT_MARGIN"),
                "rd_expense": latest.get("RESEARCH_EXPENSE"),
            }
        return None
    except Exception as e:
        print(f"[ERROR] fetch_financial_data({code}): {e}")
        return None


# ========== 4. 批量采集主函数 ==========

OUR_STOCKS = [
    "688981", "002371", "688041", "688256", "300661", "603986",  # 芯片
    "300308", "300502", "000977", "603019", "002230",  # AI/算力
    "300750", "300274", "002074",  # 储能
    "600900", "601985", "600406",  # 电力
    "002594", "300124", "688169", "601727", "601138",  # 高端制造/机器人
]


def collect_all():
    """采集所有股票数据，返回完整数据集"""
    print(f"[{datetime.now().isoformat()}] 开始采集 {len(OUR_STOCKS)} 只股票数据...")

    # 1. 实时行情
    quotes = fetch_realtime_quotes(OUR_STOCKS)
    print(f"  行情: {len(quotes)} 只")

    # 2. 财务数据
    finances = {}
    for code in OUR_STOCKS:
        time.sleep(0.3)  # 避免请求过快
        fin = fetch_financial_data(code)
        if fin:
            finances[code] = fin
    print(f"  财务: {len(finances)} 只")

    # 3. 公司信息
    infos = {}
    for code in OUR_STOCKS:
        info = fetch_company_info(code)
        if info:
            infos[code] = info
    print(f"  信息: {len(infos)} 只")

    # 合并数据
    dataset = {}
    for code in OUR_STOCKS:
        dataset[code] = {
            "quotes": quotes.get(code, {}),
            "finance": finances.get(code, {}),
            "info": infos.get(code, {}),
        }

    print(f"[完成] 采集结束，共 {len(dataset)} 只")
    return dataset


def save_dataset(dataset: dict, path: str = "data_cache.json"):
    """保存数据到缓存文件"""
    import json
    with open(path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"  数据已保存到 {path}")


def load_dataset(path: str = "data_cache.json") -> dict:
    """从缓存文件加载数据"""
    import json
    import os
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    data = collect_all()
    if data:
        save_dataset(data)
        # 打印摘要
        for code, d in data.items():
            q = d.get("quotes", {})
            if q:
                print(f"  {code} {q.get('name','')} ¥{q.get('price','')} ({q.get('change_percent','')}%)")
