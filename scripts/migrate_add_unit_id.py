from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Check if column exists
            conn.execute(text("ALTER TABLE users ADD COLUMN unit_id INTEGER REFERENCES units(id)"))
            conn.commit()
            print("Added unit_id column to users table.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column unit_id already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
