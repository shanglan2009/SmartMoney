"""
Neo4j 图数据库客户端 - A股供应链关系存储与查询
"""

from neo4j import GraphDatabase
import os


class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "serenity2024")
        self._driver = None

    @property
    def driver(self):
        if self._driver is None:
            self._driver = GraphDatabase.driver(
                self.uri, auth=(self.user, self.password)
            )
        return self._driver

    def close(self):
        if self._driver:
            self._driver.close()

    # ========== Company Queries ==========

    def get_all_companies(self) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Company) RETURN c.code AS code, c.name AS name, "
                "c.industry AS industry, c.market AS market "
                "ORDER BY c.code"
            )
            return [dict(r) for r in result]

    def get_company(self, code: str) -> dict | None:
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Company {code: $code}) RETURN c {.*} AS company",
                code=code,
            )
            record = result.single()
            return dict(record["company"]) if record else None

    def search_companies(self, query: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Company) WHERE c.code CONTAINS $q OR c.name CONTAINS $q "
                "RETURN c.code AS code, c.name AS name, c.industry AS industry "
                "LIMIT 20",
                q=query,
            )
            return [dict(r) for r in result]

    def get_companies_by_industry(self, industry: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Company {industry: $industry}) "
                "RETURN c.code AS code, c.name AS name, c.industry AS industry",
                industry=industry,
            )
            return [dict(r) for r in result]

    # ========== Supplier Queries ==========

    def get_suppliers(self, code: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (s:Supplier)-[r:SUPPLIES_TO]->(c:Company {code: $code})
                RETURN s.id AS id, s.name AS name, r.ratio AS ratio,
                       s.industry AS industry, s.financial_health AS financial_health,
                       s.is_listed AS is_listed, s.listed_code AS listed_code
                ORDER BY r.ratio DESC
                """,
                code=code,
            )
            return [dict(r) for r in result]

    def get_top_customers(self, code: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (c:Company {code: $code})-[r:SELLS_TO]->(customer)
                RETURN customer.name AS name, r.ratio AS ratio
                ORDER BY r.ratio DESC
                """,
                code=code,
            )
            return [dict(r) for r in result]

    # ========== Graph Queries ==========

    def get_supply_graph(self, code: str) -> dict:
        """获取供应链图数据用于前端可视化"""
        with self.driver.session() as session:
            # Nodes: company + its suppliers
            result = session.run(
                """
                MATCH (c:Company {code: $code})
                OPTIONAL MATCH (s:Supplier)-[r:SUPPLIES_TO]->(c)
                RETURN c {.code, .name} AS company,
                       collect(DISTINCT s {.*}) AS suppliers,
                       collect(DISTINCT r {.ratio, .label}) AS relationships
                """,
                code=code,
            )
            record = result.single()
            if not record:
                return {"nodes": [], "edges": []}

            company = dict(record["company"])
            suppliers = [dict(s) for s in record["suppliers"] if s.get("id")]
            rels = [dict(r) for r in record["relationships"] if r]

            nodes = [
                {"id": company["code"], "name": company["name"], "type": "company"}
            ]
            edges = []

            for i, sup in enumerate(suppliers):
                nodes.append({
                    "id": sup.get("id", f"s{i}"),
                    "name": sup.get("name", f"供应商{i+1}"),
                    "type": "supplier",
                    "group": i % 3,
                })
                edges.append({
                    "source": sup.get("id", f"s{i}"),
                    "target": company["code"],
                    "type": "supplies_to",
                    "amount": sup.get("ratio", 0),
                    "label": sup.get("industry", ""),
                })

            return {"nodes": nodes, "edges": edges}

    # ========== Event & History Queries ==========

    def get_risk_events(self, code: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (c:Company {code: $code})-[:HAS_EVENT]->(e:RiskEvent)
                RETURN e.date AS date, e.type AS type, e.title AS title, e.impact AS impact
                ORDER BY e.date DESC LIMIT 10
                """,
                code=code,
            )
            return [dict(r) for r in result]

    def get_rating_history(self, code: str) -> list[dict]:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (c:Company {code: $code})-[:HAS_RATING]->(r:Rating)
                RETURN r.date AS date, r.rating AS rating
                ORDER BY r.date DESC LIMIT 12
                """,
                code=code,
            )
            return [dict(r) for r in result]

    # ========== Seed Data ==========

    def seed_data(self):
        """导入示例数据"""
        with self.driver.session() as session:
            # Clear existing
            session.run("MATCH (n) DETACH DELETE n")

            # Create companies
            companies = [
                {"code": "688981", "name": "中芯国际", "industry": "芯片制造", "market": "SH"},
                {"code": "300750", "name": "宁德时代", "industry": "储能/锂电池", "market": "SZ"},
                {"code": "002594", "name": "比亚迪", "industry": "新能源车/电池", "market": "SZ"},
                {"code": "688256", "name": "寒武纪", "industry": "AI芯片", "market": "SH"},
                {"code": "300308", "name": "中际旭创", "industry": "光模块/算力", "market": "SZ"},
                {"code": "002371", "name": "北方华创", "industry": "芯片设备", "market": "SZ"},
            ]
            for c in companies:
                session.run(
                    "CREATE (c:Company {code: $code, name: $name, industry: $industry, market: $market})",
                    **c,
                )

            # Create suppliers and relationships
            supplier_rels = {
                "688981": [
                    ("ASML", 0.32, "光刻机", True, "ASML"),
                    ("应用材料", 0.18, "沉积设备", True, "AMAT"),
                    ("东京电子", 0.15, "刻蚀设备", True, "TELYF"),
                    ("中微公司", 0.08, "刻蚀设备", True, "688012"),
                    ("沪硅产业", 0.06, "硅片", True, "688126"),
                ],
                "300750": [
                    ("赣锋锂业", 0.25, "锂矿", True, "002460"),
                    ("华友钴业", 0.18, "钴矿", True, "600516"),
                    ("天齐锂业", 0.15, "锂矿", True, "002466"),
                ],
                "688256": [
                    ("台积电(TSMC)", 0.55, "晶圆代工", True, "TSM"),
                    ("中芯国际", 0.15, "晶圆代工", True, "688981"),
                    ("芯原股份", 0.08, "IP授权", True, "688521"),
                ],
                "300308": [
                    ("Lumentum", 0.28, "光芯片", True, "LITE"),
                    ("Coherent", 0.22, "光芯片", True, "COHR"),
                ],
            }

            for code, sups in supplier_rels.items():
                for name, ratio, industry, is_listed, listed_code in sups:
                    sup_id = f"sup_{name}"
                    session.run(
                        """
                        MERGE (s:Supplier {id: $id})
                        SET s.name = $name, s.industry = $industry,
                            s.is_listed = $is_listed, s.listed_code = $listed_code,
                            s.financial_health = 'healthy'
                        WITH s
                        MATCH (c:Company {code: $code})
                        CREATE (s)-[:SUPPLIES_TO {ratio: $ratio}]->(c)
                        """,
                        id=sup_id, name=name, industry=industry,
                        is_listed=is_listed, listed_code=listed_code,
                        code=code, ratio=ratio,
                    )

            # Create risk events
            events = [
                ("688981", "2026-05-20", "原材料涨价", "硅片价格季度上涨8%", "medium"),
                ("688981", "2026-05-10", "进口受限", "荷兰扩大DUV光刻机出口管制", "high"),
                ("688256", "2026-05-18", "产能不足", "台积电7nm产能分配紧张", "high"),
                ("300750", "2026-05-22", "原材料涨价", "碳酸锂价格反弹15%", "medium"),
                ("300308", "2026-05-21", "原材料涨价", "EML光芯片供应短缺加剧", "high"),
            ]
            for code, date, etype, title, impact in events:
                session.run(
                    """
                    MATCH (c:Company {code: $code})
                    CREATE (e:RiskEvent {date: $date, type: $type, title: $title, impact: $impact})
                    CREATE (c)-[:HAS_EVENT]->(e)
                    """,
                    code=code, date=date, type=etype, title=title, impact=impact,
                )

            # Create rating history
            ratings = [
                ("688981", "2026-05", "高风险偏多"),
                ("688981", "2026-04", "高风险观察"),
                ("688981", "2026-03", "高风险偏多"),
                ("300750", "2026-05", "观察"),
                ("300750", "2026-04", "积极观察"),
                ("688256", "2026-05", "高风险观察"),
                ("688256", "2026-04", "高风险偏多"),
                ("300308", "2026-05", "高风险偏多"),
                ("300308", "2026-04", "观察"),
            ]
            for code, date, rating in ratings:
                session.run(
                    """
                    MATCH (c:Company {code: $code})
                    CREATE (r:Rating {date: $date, rating: $rating})
                    CREATE (c)-[:HAS_RATING]->(r)
                    """,
                    code=code, date=date, rating=rating,
                )

            return {"status": "seeded", "companies": len(companies)}
