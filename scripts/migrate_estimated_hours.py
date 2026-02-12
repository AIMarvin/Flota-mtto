"""
Migration script to add estimated_hours column to work_orders table.
Run this script once to update the database schema.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def migrate():
    with engine.connect() as conn:
        # Check if column exists first
        try:
            result = conn.execute(text("SELECT estimated_hours FROM work_orders LIMIT 1"))
            print("✅ Column 'estimated_hours' already exists. No migration needed.")
            return
        except Exception:
            pass  # Column doesn't exist, proceed with migration
        
        # Add the column
        try:
            conn.execute(text("""
                ALTER TABLE work_orders 
                ADD COLUMN estimated_hours INTEGER DEFAULT 1
            """))
            conn.commit()
            print("✅ Successfully added 'estimated_hours' column to work_orders table.")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
