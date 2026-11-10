#!/usr/bin/env python3
"""
Database Seeder Script for AccessAI.
Seeds authoritative data sources, schemes, eligibility rules, opportunities, and courses.
All operations use ON CONFLICT DO NOTHING for safe idempotency.
"""
import os
import sys

# Ensure backend app is on sys.path
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, "apps", "api"))

from app.database.session import SessionLocal
from sqlalchemy import text


def seed_database():
    seed_sql = os.path.join(root, "supabase", "seed.sql")
    if not os.path.exists(seed_sql):
        print(f"Error: seed file not found at {seed_sql}")
        sys.exit(1)

    with open(seed_sql, "r") as f:
        sql = f.read()

    db = SessionLocal()
    try:
        print("Executing authoritative seed into PostgreSQL...")
        db.execute(text(sql))
        db.commit()
        print("Authoritative initial seed dataset committed successfully!")

        # Verify counts
        for table in ["data_sources", "schemes", "scheme_eligibility_rules", "opportunities", "courses", "course_materials"]:
            cnt = db.execute(text(f"SELECT count(*) FROM {table};")).scalar()
            print(f"  - {table}: {cnt} rows")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
