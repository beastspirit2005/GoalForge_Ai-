import sqlite3
conn = sqlite3.connect('goalforge.db')
cursor = conn.cursor()
cursor.execute("SELECT otp_code FROM users WHERE email='harshit2005sharma@gmail.com'")
row = cursor.fetchone()
if row:
    print('OTP:', row[0])
else:
    print('User not found')
conn.close()
