"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

// A股常见代码前缀映射
const marketPrefix: Record<string, string> = {
  "6": "SH",
  "9": "SH",
  "0": "SZ",
  "2": "SZ",
  "3": "SZ",
  "4": "BJ",
  "8": "BJ",
};

// 八大重点行业覆盖标的（AI/电力/存储/储能/芯片/机器人/算力/高端制造）
const popularStocks = [
  { code: "688981", name: "中芯国际", industry: "芯片" },
  { code: "002371", name: "北方华创", industry: "芯片设备" },
  { code: "688041", name: "海光信息", industry: "芯片/算力" },
  { code: "688256", name: "寒武纪", industry: "AI芯片" },
  { code: "603986", name: "兆易创新", industry: "存储芯片" },
  { code: "300661", name: "圣邦股份", industry: "模拟芯片" },
  { code: "300308", name: "中际旭创", industry: "算力/光模块" },
  { code: "300502", name: "新易盛", industry: "算力/光模块" },
  { code: "000977", name: "浪潮信息", industry: "AI服务器/算力" },
  { code: "603019", name: "中科曙光", industry: "算力/超算" },
  { code: "002230", name: "科大讯飞", industry: "AI" },
  { code: "300750", name: "宁德时代", industry: "储能/锂电池" },
  { code: "300274", name: "阳光电源", industry: "储能" },
  { code: "002074", name: "国轩高科", industry: "储能/锂电池" },
  { code: "600900", name: "长江电力", industry: "电力" },
  { code: "601985", name: "中国核电", industry: "电力/核电" },
  { code: "600406", name: "国电南瑞", industry: "电力设备" },
  { code: "002594", name: "比亚迪", industry: "高端制造/新能源车" },
  { code: "300124", name: "汇川技术", industry: "机器人/工控" },
  { code: "688169", name: "石头科技", industry: "机器人" },
  { code: "601727", name: "上海电气", industry: "高端制造/电力" },
  { code: "601138", name: "工业富联", industry: "高端制造/AI" },
];

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? popularStocks.filter(
        (s) =>
          s.code.includes(query) ||
          s.name.includes(query) ||
          s.industry.includes(query)
      )
    : [];

  const handleSearch = useCallback(
    (code: string) => {
      setQuery("");
      setShowSuggestions(false);
      router.push(`/stock/${code}`);
    },
    [router]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center min-h-10 rounded-md border border-rule bg-white px-3 text-sm focus-within:ring-2 focus-within:ring-blue-200 transition-shadow">
        <Search className="h-4 w-4 text-muted mr-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length > 0) {
              handleSearch(filtered[0].code);
            }
          }}
          placeholder="搜索股票代码/名称..."
          className="flex-1 bg-transparent outline-none text-ink placeholder:text-muted-2 min-w-0"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && query.trim() && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-panel border border-rule rounded-xl shadow-lg overflow-hidden z-50">
          {filtered.slice(0, 8).map((stock) => (
            <button
              key={stock.code}
              onClick={() => handleSearch(stock.code)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-paper-3 transition-colors"
            >
              <span className="font-mono text-sm text-ink font-medium">
                {stock.code}
              </span>
              <span className="text-sm text-ink-2">{stock.name}</span>
              <span className="text-xs text-muted ml-auto">{stock.industry}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
