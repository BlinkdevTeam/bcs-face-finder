import os
import psycopg2
import unicodedata   # ← NEW

# =====================
# Unicode Normalization (CRITICAL FIX)
# =====================
def normalize(p):
    return unicodedata.normalize("NFC", p)

# =====================
# NAS ROOT (CHANGE IF NEEDED)
# =====================
NAS_ROOT = normalize("/Volumes/BCS 2024/Sample Folder")

# =====================
# DATABASE CONFIG
# =====================
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "BcsFaceFinder",
    "user": "postgres",
    "password": "blinkpostgresql"
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
def get_or_create_folder(name, parent_id, file_path):
    file_path = normalize(file_path)

    cursor.execute(
        "SELECT id FROM folders WHERE file_path = %s",
        (file_path,)
    )
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute("""
        INSERT INTO folders (name, parent_id, file_path)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (name, parent_id, file_path))

    return cursor.fetchone()[0]


def insert_file(folder_id, file_name, file_path):
    file_path = normalize(file_path)

    cursor.execute(
        "SELECT id FROM nas_files WHERE file_path = %s",
        (file_path,)
    )
    if cursor.fetchone():
        return  # already exists

    cursor.execute("""
        INSERT INTO nas_files (folder_id, file_name, file_path)
        VALUES (%s, %s, %s)
    """, (folder_id, file_name, file_path))


# =====================
# STEP 1 — Scan NAS & Build List
# =====================
print("📂 Scanning NAS...")

nas_all_files = set()

for root, dirs, files in os.walk(NAS_ROOT):
    root = normalize(root)

    folder_name = os.path.basename(root)
    parent_path = normalize(os.path.dirname(root))

    # find parent folder id
    if root == NAS_ROOT:
        parent_id = None
    else:
        cursor.execute(
            "SELECT id FROM folders WHERE file_path = %s",
            (parent_path,)
        )
        parent = cursor.fetchone()
        parent_id = parent[0] if parent else None

    # create folder
    folder_id = get_or_create_folder(folder_name, parent_id, root)

    # loop images
    for file_name in files:
        if not file_name.lower().endswith(IMAGE_EXTENSIONS):
            continue

        if file_name in (".DS_Store", "Thumbs.db"):
            continue

        file_path = normalize(os.path.join(root, file_name))

        nas_all_files.add(file_path)
        insert_file(folder_id, file_name, file_path)

conn.commit()
print("📁 Insert/Update finished.")

# =====================
# STEP 2 — DELETE FILES REMOVED FROM NAS
# =====================
print("🗑 Checking for deleted files...")

cursor.execute("SELECT id, file_path FROM nas_files")
db_files = cursor.fetchall()

deleted_count = 0

for row in db_files:
    file_id = row[0]
    file_path = normalize(row[1])

    if file_path not in nas_all_files:
        print(f"❌ File removed from NAS → deleting from DB: {file_path}")

        cursor.execute("DELETE FROM face_embeddings WHERE file_id = %s", (file_id,))
        cursor.execute("DELETE FROM nas_files WHERE id = %s", (file_id,))
        deleted_count += 1

conn.commit()

print(f"🧹 Cleanup complete → Deleted {deleted_count} missing files.")

cursor.close()
conn.close()

print("✅ NAS sync completed successfully.")
