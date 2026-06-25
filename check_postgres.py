import asyncio
import asyncpg
from dotenv import load_dotenv
import os
from pathlib import Path

# Load env file from the project root
load_dotenv(Path("backend").resolve().parents[0] / ".env")

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return
        
    db_url = db_url.replace("postgresql+asyncpg", "postgresql")
    print(f"Connecting to {db_url}")
    conn = await asyncpg.connect(db_url)
    try:
        # Get super admins
        sa_records = await conn.fetch("SELECT id, name, role FROM users WHERE role = 'super_admin'")
        print(f"Super Admins: {len(sa_records)}")
        for r in sa_records:
            print(dict(r))
            
        # Get admins
        admin_records = await conn.fetch("SELECT id, name, role, manager_id, admin_id FROM users WHERE role = 'admin'")
        print(f"\nAdmins: {len(admin_records)}")
        for r in admin_records:
            print(dict(r))
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
