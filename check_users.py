import asyncio
import sqlite3

def main():
    conn = sqlite3.connect('backend/goalforge.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, role, manager_id, admin_id FROM users")
    users = cursor.fetchall()
    
    super_admins = [u for u in users if u[2] == 'super_admin']
    print("Super Admins:")
    for sa in super_admins:
        print(sa)
        
    admins = [u for u in users if u[2] == 'admin']
    print("\nAdmins:")
    for a in admins:
        print(a)
        
    print("\nDirect reports to super_admins:")
    for u in users:
        if u[3] in [sa[0] for sa in super_admins] or u[4] in [sa[0] for sa in super_admins]:
            print(u)
            
if __name__ == "__main__":
    main()
