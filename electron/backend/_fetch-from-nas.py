import os
import psycopg2

# =====================
# NAS ROOT (CHANGE IF NEEDED)
# =====================
NAS_ROOT = "/Volumes/BCS 2024/Sample Folder"

# =====================
# DATABASE CONFIG
# =====================
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "SampleDatabase",
    "user": "postgres",
    "password": "blinkdatabase"
}

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

# =====================
# DB CONNECTION
# =====================
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()


# =====================
# HELPERS
# =====================
def get_or_create_folder(name, parent_id, full_path):
    cursor.execute(
        "SELECT id FROM folders WHERE full_path = %s",
        (full_path,)
    )
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute("""
        INSERT INTO folders (name, parent_id, full_path)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (name, parent_id, full_path))

    return cursor.fetchone()[0]


def insert_file(folder_id, file_name, full_path):
    cursor.execute(
        "SELECT id FROM nas_files WHERE full_path = %s",
        (full_path,)
    )
    if cursor.fetchone():
        return  # already exists

    cursor.execute("""
        INSERT INTO nas_files (folder_id, file_name, full_path)
        VALUES (%s, %s, %s)
    """, (folder_id, file_name, full_path))


# =====================
# STEP 1 — Scan NAS & Build List
# =====================
print("📂 Scanning NAS...")

nas_all_files = set()  # full_path list from NAS

for root, dirs, files in os.walk(NAS_ROOT):
    folder_name = os.path.basename(root)
    parent_path = os.path.dirname(root)

    # parent folder
    if root == NAS_ROOT:
        parent_id = None
    else:
        cursor.execute(
            "SELECT id FROM folders WHERE full_path = %s",
            (parent_path,)
        )
        parent = cursor.fetchone()
        parent_id = parent[0] if parent else None

    # create or get folder
    folder_id = get_or_create_folder(folder_name, parent_id, root)

    # loop files
    for file_name in files:
        if not file_name.lower().endswith(IMAGE_EXTENSIONS):
            continue

        if file_name in (".DS_Store", "Thumbs.db"):
            continue

        full_path = os.path.join(root, file_name)

        nas_all_files.add(full_path)
        insert_file(folder_id, file_name, full_path)

conn.commit()
print("📁 Insert/Update finished.")

# =====================
# STEP 2 — DELETE FILES REMOVED FROM NAS
# =====================
print("🗑 Checking for deleted files...")

cursor.execute("SELECT id, full_path FROM nas_files")
db_files = cursor.fetchall()

deleted_count = 0

for row in db_files:
    file_id = row[0]
    full_path = row[1]

    if full_path not in nas_all_files:
        print(f"❌ File removed from NAS → deleting from DB: {full_path}")

        # delete embedding first
        cursor.execute("DELETE FROM face_embeddings WHERE file_id = %s", (file_id,))
        # delete file record
        cursor.execute("DELETE FROM nas_files WHERE id = %s", (file_id,))
        deleted_count += 1

conn.commit()

print(f"🧹 Cleanup complete → Deleted {deleted_count} missing files.")

# =====================
# FINISH
# =====================
cursor.close()
conn.close()

print("✅ NAS sync completed successfully.")
