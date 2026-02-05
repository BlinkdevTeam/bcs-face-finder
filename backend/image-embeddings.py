import os
import psycopg2
import numpy as np
import cv2
from psycopg2.extras import RealDictCursor
from insightface.app import FaceAnalysis

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

def get_db():
    return psycopg2.connect(
        **DB_CONFIG,
        cursor_factory=RealDictCursor
    )

# =====================
# INSIGHTFACE SETUP
# =====================
app = FaceAnalysis(
    name="buffalo_l",                     # best accuracy model
    providers=["CPUExecutionProvider"]     # works on Windows & macOS
)
app.prepare(ctx_id=0)

# =====================
# INDEXING LOGIC
# =====================
def index_faces():
    conn = get_db()
    cursor = conn.cursor()

    # Get NAS images that are NOT indexed yet
    cursor.execute("""
        SELECT nf.id, nf.full_path
        FROM nas_files nf
        LEFT JOIN face_embeddings fe ON fe.file_id = nf.id
        WHERE fe.id IS NULL
    """)

    files = cursor.fetchall()
    print(f"📂 Images to index: {len(files)}")

    indexed = 0
    skipped = 0

    for file in files:
        file_id = file["id"]
        path = file["full_path"]

        if not os.path.exists(path):
            print(f"❌ Missing file: {path}")
            skipped += 1
            continue

        try:
            img = cv2.imread(path)
            if img is None:
                print(f"⚠️ Cannot read image: {path}")
                skipped += 1
                continue

            faces = app.get(img)

            if not faces:
                print(f"⚠️ No face detected: {path}")
                skipped += 1
                continue

            # Take the largest face (best practice)
            face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
            embedding = face.embedding.astype(float).tolist()

            cursor.execute("""
                INSERT INTO face_embeddings (file_id, embedding)
                VALUES (%s, %s)
            """, (file_id, embedding))

            conn.commit()
            indexed += 1
            print(f"✅ Indexed: {path}")

        except Exception as e:
            print(f"🔥 Error processing {path}: {e}")
            skipped += 1

    cursor.close()
    conn.close()

    print("===================================")
    print(f"🎉 Indexing complete")
    print(f"✅ Indexed: {indexed}")
    print(f"⚠️ Skipped: {skipped}")
    print("===================================")

# =====================
# ENTRY POINT
# =====================
if __name__ == "__main__":
    index_faces()
