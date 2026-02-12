import sqlite3

def migrate():
    conn = sqlite3.connect('flota.db')
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'profile_image' not in columns:
            print("Adding profile_image column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image TEXT")
            conn.commit()
            print("Migration successful: profile_image added.")
        else:
            print("Column profile_image already exists.")
            
    except Exception as e:
        print(f"Error migrating: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
