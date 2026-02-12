
import sqlite3
import os

DB_PATH = "flota.db"

def migrate_db():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Add columns to checklists
        try:
            cursor.execute("ALTER TABLE checklists ADD COLUMN is_priority BOOLEAN DEFAULT 0")
            print("Added is_priority to checklists")
        except sqlite3.OperationalError as e:
            print(f"Skipping is_priority: {e}")

        try:
            cursor.execute("ALTER TABLE checklists ADD COLUMN generated_order_id INTEGER REFERENCES work_orders(id)")
            print("Added generated_order_id to checklists")
        except sqlite3.OperationalError as e:
            print(f"Skipping generated_order_id: {e}")

        # 2. Add columns to units
        try:
            cursor.execute("ALTER TABLE units ADD COLUMN manager_id INTEGER REFERENCES users(id)")
            print("Added manager_id to units")
        except sqlite3.OperationalError as e:
            print(f"Skipping manager_id: {e}")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
