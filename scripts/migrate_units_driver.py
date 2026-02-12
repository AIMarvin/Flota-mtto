import sqlite3

def migrate():
    conn = sqlite3.connect('flota.db')
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(units)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'driver_id' not in columns:
            print("Adding driver_id column to units table...")
            cursor.execute("ALTER TABLE units ADD COLUMN driver_id INTEGER REFERENCES users(id)")
            conn.commit()
            print("Migration successful: driver_id added.")
        else:
            print("Column driver_id already exists.")
            
    except Exception as e:
        print(f"Error migrating: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
