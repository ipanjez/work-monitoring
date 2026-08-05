import sqlite3
import json
import os

db_path = './prisma/dev.db'
if not os.path.exists(db_path):
    db_path = './dev.db'

print(f"Membuka SQLite di: {db_path} untuk mengekspor data akun...")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

data = {}
tables_to_dump = ['User', 'PasswordResetRequest']

for table in tables_to_dump:
    try:
        cursor.execute(f"SELECT * FROM {table};")
        rows = cursor.fetchall()
        data[table] = [dict(row) for row in rows]
        print(f"Mengekspor {len(rows)} baris dari tabel {table}")
    except Exception as e:
        print(f"Gagal mengekspor {table}: {e}")

with open('sqlite_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Ekspor selesai.")
conn.close()
