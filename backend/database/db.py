import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sales_db")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def create_tables():
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("DROP TABLE IF EXISTS results CASCADE;")
    cur.execute("DROP TABLE IF EXISTS companies CASCADE;")
    cur.execute("DROP TABLE IF EXISTS workspaces CASCADE;")
    
    cur.execute("""
        CREATE TABLE workspaces (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            config JSONB DEFAULT '{}',
            lead_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    cur.execute("""
        CREATE TABLE companies (
            id SERIAL PRIMARY KEY,
            workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            score FLOAT DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    cur.execute("""
        CREATE TABLE results (
            id SERIAL PRIMARY KEY,
            workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            agent_name TEXT,
            output JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    create_tables()