import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
import asyncpg

load_dotenv(Path('backend').resolve().parents[0] / '.env')

async def main():
    # 1. Connect to DB to get Super Admin ID 1
    db_url = os.environ.get('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(db_url)
    
    try:
        user_id = 1
        # Test hierarchy query exactly as backend does
        employees = await conn.fetch("""
            SELECT id, name, role, is_active, manager_id, admin_id 
            FROM users 
            WHERE (manager_id = $1 OR admin_id = $1) AND is_active = true
        """, user_id)
        
        print("Backend Query Results for Super Admin (ID 1):")
        for e in employees:
            print(dict(e))
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
