"""
A股供应链稀缺度分析平台 - FastAPI 后端
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os

from neo4j_client import Neo4jClient
from scoring_engine import ScoringEngine

app = FastAPI(title="Serenity A股供应链分析", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

neo4j = Neo4jClient()
engine = ScoringEngine()


# ========== Data Models ==========

class CompanyResponse(BaseModel):
    code: str
    name: str
    industry: str
    market: str
    revenue: Optional[float] = None
    revenue_yoy: Optional[float] = None
    gross_margin: Optional[float] = None
    rd_expense: Optional[float] = None


class ScoreDimension(BaseModel):
    name: str
    score: float
    weight: float


class SupplyChainScore(BaseModel):
    overall: float
    rating: str
    dimensions: list[ScoreDimension]


class SupplierResponse(BaseModel):
    id: str
    name: str
    ratio: float
    industry: Optional[str] = None
    financial_health: Optional[str] = None
    is_listed: bool
    listed_code: Optional[str] = None


class StockListItem(BaseModel):
    code: str
    name: str
    industry: str
    score: float
    rating: str
    price_change: Optional[str] = None
    signal: Optional[str] = None


class StockAnalysisResponse(BaseModel):
    company: CompanyResponse
    score: SupplyChainScore
    suppliers: list[SupplierResponse]
    top_customers: list[dict]
    events: list[dict]
    history: list[dict]


# ========== API Endpoints ==========

@app.get("/api/stocks", response_model=list[StockListItem])
async def get_stock_list():
    """获取所有覆盖的股票列表"""
    stocks = neo4j.get_all_companies()
    return [
        StockListItem(
            code=s["code"],
            name=s["name"],
            industry=s.get("industry", ""),
            score=engine.calculate_score(s["code"]),
            rating=engine.get_rating_from_score(engine.calculate_score(s["code"])),
        )
        for s in stocks
    ]


@app.get("/api/stock/{code}", response_model=StockAnalysisResponse)
async def get_stock_analysis(code: str):
    """获取个股供应链分析详情"""
    company = neo4j.get_company(code)
    if not company:
        raise HTTPException(status_code=404, detail=f"股票 {code} 未找到")

    suppliers = neo4j.get_suppliers(code)
    score = engine.calculate_full_score(code, suppliers)

    return StockAnalysisResponse(
        company=CompanyResponse(**company),
        score=score,
        suppliers=[
            SupplierResponse(**s) for s in suppliers
        ],
        top_customers=neo4j.get_top_customers(code),
        events=neo4j.get_risk_events(code),
        history=neo4j.get_rating_history(code),
    )


@app.get("/api/search")
async def search_stocks(q: str = ""):
    """搜索股票"""
    results = neo4j.search_companies(q)
    return [
        StockListItem(
            code=s["code"],
            name=s["name"],
            industry=s.get("industry", ""),
            score=engine.calculate_score(s["code"]),
            rating=engine.get_rating_from_score(engine.calculate_score(s["code"])),
        )
        for s in results
    ]


@app.get("/api/industry/{industry}")
async def get_industry_analysis(industry: str):
    """获取行业供应链分析"""
    companies = neo4j.get_companies_by_industry(industry)
    scores = []
    for c in companies:
        score = engine.calculate_score(c["code"])
        scores.append({**c, "score": score, "rating": engine.get_rating_from_score(score)})
    return {
        "industry": industry,
        "companies": scores,
        "avg_score": sum(s["score"] for s in scores) / len(scores) if scores else 0,
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "time": datetime.now().isoformat()}
