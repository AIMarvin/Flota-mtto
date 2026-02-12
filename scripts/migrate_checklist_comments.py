"""
Migration script to add 'comments' column to checklists table.
Run this script to update existing database.
"""
import sqlite3
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def migrate():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'flota.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(checklists)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'comments' in columns:
            print("✅ Column 'comments' already exists in checklists table")
            return True
        
        # Add the column
        cursor.execute("ALTER TABLE checklists ADD COLUMN comments TEXT")
        conn.commit()
        print("✅ Successfully added 'comments' column to checklists table")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
