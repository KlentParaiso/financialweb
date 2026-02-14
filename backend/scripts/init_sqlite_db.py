"""
Create SQLite database and assessments table (no Alembic).
Run from backend dir: python scripts/init_sqlite_db.py
Set DATABASE_URL=sqlite:///./finance.db in .env or leave default.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import sqlite3

def main():
    db_path = os.path.join(os.path.dirname(__file__), "..", "finance.db")
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            public_id TEXT UNIQUE,
            created_at TEXT,
            payload TEXT NOT NULL,
            analysis TEXT NOT NULL
        )
    """)
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_assessments_public_id ON assessments(public_id)"
    )
    conn.commit()
    conn.close()
    print("SQLite DB ready:", db_path)

if __name__ == "__main__":
    main()
