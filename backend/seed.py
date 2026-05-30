"""
Seed script for Neo4j - populates initial supply chain data
Run: python seed.py
"""

from neo4j_client import Neo4jClient


def seed():
    client = Neo4jClient()
    try:
        result = client.seed_data()
        print(f"✅ Seed complete: {result}")
    except Exception as e:
        print(f"❌ Seed error: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    seed()
