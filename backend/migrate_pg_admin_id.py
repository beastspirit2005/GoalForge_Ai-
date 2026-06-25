from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.environ.get('DATABASE_URL_SYNC')
if not url:
    print("No DATABASE_URL_SYNC found")
    exit(1)

engine = create_engine(url)

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE users ADD COLUMN admin_id INTEGER REFERENCES users(id)'))
        conn.commit()
        print("Successfully added admin_id column to users table.")
    except Exception as e:
        print(f"Error: {e}")
