"""
供应链稀缺度评分引擎

评分维度:
1. 供应商集中度 (25%) - CR1/CR5越高越危险
2. 供应商可替代性 (20%) - 供应商所在行业垄断程度
3. 供应商财务健康度 (15%) - 供应商自身经营风险传导
4. 原材料/进口依赖度 (15%) - 受地缘政治/汇率影响程度
5. 供应商议价能力 (15%) - 应付账款周转+毛利率变化
6. 下游客户集中度 (10%) - 双向挤压风险

评分范围: 0-100 (越高越危险)
评级映射:
  85-100: 高风险观察
  70-84:  高风险偏多
  40-69:  观察
  20-39:  积极观察
  0-19:   谨慎
"""

from typing import Optional


class ScoringEngine:
    """供应链稀缺度评分引擎"""

    # 评级阈值
    RATING_THRESHOLDS = [
        (85, "高风险观察"),
        (70, "高风险偏多"),
        (40, "观察"),
        (20, "积极观察"),
        (0, "谨慎"),
    ]

    # 维度权重
    DIMENSIONS = [
        {"name": "供应商集中度", "weight": 0.25},
        {"name": "供应商可替代性", "weight": 0.20},
        {"name": "供应商财务健康度", "weight": 0.15},
        {"name": "原材料/进口依赖", "weight": 0.15},
        {"name": "供应商议价能力", "weight": 0.15},
        {"name": "下游客户集中度", "weight": 0.10},
    ]

    def get_rating_from_score(self, score: float) -> str:
        """根据分数返回评级"""
        for threshold, rating in self.RATING_THRESHOLDS:
            if score >= threshold:
                return rating
        return "谨慎"

    def calculate_score(self, code: str) -> float:
        """简化的评分计算（无供应商详情时使用默认值）"""
        # 这里在无完整数据时返回默认分
        # 完整评分由 calculate_full_score 实现
        return 50.0

    def calculate_full_score(
        self, code: str, suppliers: list[dict]
    ) -> dict:
        """
        完整供应链评分计算

        Args:
            code: 股票代码
            suppliers: 供应商列表，每项包含 ratio, financial_health 等

        Returns:
            dict: {overall, rating, dimensions: [{name, score, weight}]}
        """
        dim_scores = {}

        # 1. 供应商集中度评分 (0-100, 越高越危险)
        dim_scores["供应商集中度"] = self._score_concentration(suppliers)

        # 2. 供应商可替代性评分
        dim_scores["供应商可替代性"] = self._score_substitutability(suppliers)

        # 3. 供应商财务健康度评分
        dim_scores["供应商财务健康度"] = self._score_financial_health(suppliers)

        # 4. 原材料/进口依赖评分
        dim_scores["原材料/进口依赖"] = self._score_import_dependency(suppliers)

        # 5. 供应商议价能力评分
        dim_scores["供应商议价能力"] = self._score_bargaining_power(suppliers)

        # 6. 下游客户集中度评分
        dim_scores["下游客户集中度"] = self._score_customer_concentration()

        # 综合加权
        total = 0.0
        dimensions_out = []
        for dim in self.DIMENSIONS:
            score = dim_scores.get(dim["name"], 50)
            total += score * dim["weight"]
            dimensions_out.append({
                "name": dim["name"],
                "score": round(score, 1),
                "weight": dim["weight"],
            })

        overall = round(total, 1)
        rating = self.get_rating_from_score(overall)

        return {
            "overall": overall,
            "rating": rating,
            "dimensions": dimensions_out,
        }

    def _score_concentration(self, suppliers: list[dict]) -> float:
        """
        供应商集中度评分:
        - CR1 (最大供应商占比): >30% → 高风险, <10% → 低风险
        - CR5 (前5大总占比): >70% → 高风险, <30% → 低风险
        """
        if not suppliers:
            return 30  # 无数据默认中等偏低

        ratios = sorted([s.get("ratio", 0) for s in suppliers], reverse=True)
        cr1 = ratios[0] if ratios else 0
        cr5 = sum(ratios[:5])

        # CR1评分
        cr1_score = min(100, cr1 * 100 / 0.3 * 60)  # 30%对应60分
        # CR5评分
        cr5_score = min(100, cr5 * 100 / 0.7 * 40)  # 70%对应40分

        return round(min(100, cr1_score + cr5_score) / 2, 1)

    def _score_substitutability(self, suppliers: list[dict]) -> float:
        """
        供应商可替代性评分:
        - 供应商是上市公司 → 更易替代 (低分)
        - 非上市/国外供应商 → 难替代 (高分)
        """
        if not suppliers:
            return 40

        score_sum = 0
        for s in suppliers:
            ratio = s.get("ratio", 0)
            is_listed = s.get("is_listed", False)
            name = s.get("name", "")
            # 国外供应商更难替代
            is_foreign = any(k in name for k in ["ASML", "Lumentum", "Coherent", "TSMC", "台积电"])

            if is_foreign:
                score_sum += ratio * 90
            elif is_listed:
                score_sum += ratio * 40
            else:
                score_sum += ratio * 70

        return round(min(100, score_sum), 1)

    def _score_financial_health(self, suppliers: list[dict]) -> float:
        """
        供应商财务健康度评分
        """
        if not suppliers:
            return 40

        health_map = {"healthy": 20, "normal": 50, "risky": 85}
        score_sum = 0
        total_ratio = 0

        for s in suppliers:
            ratio = s.get("ratio", 0)
            health = s.get("financial_health", "normal")
            score_sum += ratio * health_map.get(health, 50)
            total_ratio += ratio

        if total_ratio == 0:
            return 50

        return round(min(100, score_sum / total_ratio), 1)

    def _score_import_dependency(self, suppliers: list[dict]) -> float:
        """
        原材料/进口依赖评分
        """
        if not suppliers:
            return 40

        foreign_keywords = ["ASML", "Lumentum", "Coherent", "TSMC", "台积电",
                            "应用材料", "东京电子", "荷兰", "美国"]
        foreign_ratio = 0
        for s in suppliers:
            name = s.get("name", "")
            ratio = s.get("ratio", 0)
            if any(kw in name for kw in foreign_keywords):
                foreign_ratio += ratio

        return round(min(100, foreign_ratio * 100 + 20), 1)

    def _score_bargaining_power(self, suppliers: list[dict]) -> float:
        """
        供应商议价能力评分
        """
        if not suppliers:
            return 50

        ratios = [s.get("ratio", 0) for s in suppliers]
        max_ratio = max(ratios) if ratios else 0

        # 单一供应商占比过高 → 议价能力强 → 风险高
        if max_ratio > 0.4:
            return 80
        elif max_ratio > 0.25:
            return 60
        elif max_ratio > 0.15:
            return 40
        else:
            return 25

    def _score_customer_concentration(self) -> float:
        """
        下游客户集中度评分
        默认使用中等风险值
        """
        return 50.0
