import sqlite3
import os

def run_migration():
    db_path = os.path.join(os.path.dirname(__file__), 'goalforge.db')
    print(f"Migrating database at: {db_path}")
    
    if not os.path.exists(db_path):
        print("Database not found. Exiting.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add the admin_id column
        cursor.execute('ALTER TABLE users ADD COLUMN admin_id INTEGER REFERENCES users(id)')
        conn.commit()
        print("Successfully added admin_id column to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column admin_id already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
