"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const mockPerformance = [
  { month: "2026-01", correct: 8, wrong: 2, accuracy: "80%" },
  { month: "2026-02", correct: 7, wrong: 3, accuracy: "70%" },
  { month: "2026-03", correct: 9, wrong: 1, accuracy: "90%" },
  { month: "2026-04", correct: 8, wrong: 2, accuracy: "80%" },
  { month: "2026-05", correct: 6, wrong: 1, accuracy: "86%" },
];

export default function PerformancePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-4">模型战绩</h1>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">总预测准确率</span>
          <p className="text-3xl font-bold text-green-600 mt-1">82%</p>
          <p className="text-xs text-muted mt-1">基于5个月回测数据</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">高风险预警准确率</span>
          <p className="text-3xl font-bold text-amber-400 mt-1">78%</p>
          <p className="text-xs text-muted mt-1">高风险观察/偏多评级</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">覆盖标的数量</span>
          <p className="text-3xl font-bold text-blue-400 mt-1">16</p>
          <p className="text-xs text-muted mt-1">重点行业持续跟踪</p>
        </div>
      </div>

      <div className="rounded-lg border border-rule bg-panel overflow-hidden">
        <div className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2">
          月度表现
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule text-xs text-muted">
              <th className="text-left px-4 py-2.5 font-medium">月份</th>
              <th className="text-center px-4 py-2.5 font-medium">正确</th>
              <th className="text-center px-4 py-2.5 font-medium">错误</th>
              <th className="text-right px-4 py-2.5 font-medium">准确率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {mockPerformance.map((row) => (
              <tr key={row.month} className="hover:bg-paper-3">
                <td className="px-4 py-2.5 text-ink-2">{row.month}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    {row.correct}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-3 w-3" />
                    {row.wrong}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-ink">{row.accuracy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
