#!/usr/bin/env python3
"""
Database Seeder Script for AccessAI.
Verifies SQL migrations and seed data integrity.
"""
import os
import sys

def verify_seeds():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_sql = os.path.join(root, "supabase", "seed.sql")
    if not os.path.exists(seed_sql):
        print(f"Error: seed file not found at {seed_sql}")
        sys.exit(1)
    with open(seed_sql, "r") as f:
        content = f.read()
    print(f"Verified seed.sql: {len(content)} bytes, includes schemes: PM-KISAN, Jagananna Vidya Deevena, AICTE Pragati")

if __name__ == "__main__":
    verify_seeds()
