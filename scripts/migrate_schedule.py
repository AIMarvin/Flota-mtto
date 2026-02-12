
import sqlite3

def add_column():
    conn = sqlite3.connect("flota.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE work_orders ADD COLUMN scheduled_date DATETIME")
        print("Column 'scheduled_date' added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error (column might already exist): {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_column()
