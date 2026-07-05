import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "portfolio.db")

print(f"Modificando la base de datos: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE certifications ADD COLUMN certificate_file_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL;")
    conn.commit()
    print("Columna 'certificate_file_id' agregada exitosamente a 'certifications'.")
except sqlite3.OperationalError as e:
    print(f"Error (es posible que la columna ya exista): {e}")
except Exception as e:
    print(f"Error inesperado: {e}")
finally:
    if conn:
        conn.close()
