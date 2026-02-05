from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
import cv2
import os
from insightface.app import FaceAnalysis

# =====================
# DATABASE CONFIG (LOCAL MODE)
# =====================
DB_CONFIG = {
    "host": "localhost",       # LOCAL POSTGRES
    "port": 5432,
    "dbname": "SampleDatabase",
    "user": "postgres",
    "password": "blinkdatabase"
}

# =====================
# APP
# =====================
app = FastAPI(title="NAS Face Recognition API")

# =====================
# CORS (DEV MODE)
# =====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # DEV ONLY
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# DB CONNECTION
# =====================
def get_db():
    return psycopg2.connect(
        **DB_CONFIG,
        cursor_factory=RealDictCursor
    )

# =====================
# INSIGHTFACE (LOAD ONCE)
# =====================
face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)
face_app.prepare(ctx_id=0)

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# =====================
# API: GET FOLDERS
# =====================
@app.get("/folders")
def get_folders():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, parent_id, full_path
        FROM folders
        ORDER BY parent_id NULLS FIRST, name
    """)

    folders = cursor.fetchall()
    cursor.close()
    conn.close()

    return {
        "count": len(folders),
        "folders": folders
    }

# =====================
# API: FACE SEARCH (WITH RECURSIVE FOLDERS)
# =====================
@app.post("/face-search")
async def face_search(
    image: UploadFile = File(...),
    folder_ids: str = Form(...)
):
    # Parse folder IDs
    folder_ids = [int(x) for x in folder_ids.split(",") if x]

    if not folder_ids:
        return {"error": "No folders selected"}

    # Decode image
    contents = await image.read()
    np_img = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image"}

    faces = face_app.get(img)
    if not faces:
        return {"error": "No face detected in reference image"}

    # Use largest face
    face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
    ref_embedding = face.embedding.astype(float)

    conn = get_db()
    cursor = conn.cursor()

    # 🔁 Recursive folder expansion
    sql = """
    WITH RECURSIVE folder_tree AS (
        SELECT id
        FROM folders
        WHERE id = ANY(%s)

        UNION ALL

        SELECT f.id
        FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
    )
    SELECT 
        fe.file_id,
        fe.embedding,
        nf.file_name,
        nf.folder_id,
        f.full_path AS folder_path
    FROM face_embeddings fe
    JOIN nas_files nf ON nf.id = fe.file_id
    JOIN folders f ON f.id = nf.folder_id
    WHERE nf.folder_id IN (SELECT id FROM folder_tree)
    """

    cursor.execute(sql, (folder_ids,))
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    SIMILARITY_THRESHOLD = 0.45  # Discovery mode

    results = []
    for row in rows:
        db_embedding = np.array(row["embedding"], dtype=float)
        similarity = cosine_similarity(ref_embedding, db_embedding)

        if similarity < SIMILARITY_THRESHOLD:
            continue

        results.append({
            "file_id": row["file_id"],
            "file_name": row["file_name"],
            "folder_id": row["folder_id"],
            "folder_path": row["folder_path"],
            "similarity": similarity
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)

    return {
        "matches": results,
        "total_matches": len(results)
    }

# =====================
# API: SERVE IMAGE
# =====================
@app.get("/image/{file_id}")
def get_image(file_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT full_path
        FROM nas_files
        WHERE id = %s
    """, (file_id,))

    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return {"error": "Image not found"}

    path = row["full_path"]

    if not os.path.exists(path):
        return {"error": f"File missing on NAS: {path}"}

    return FileResponse(
        path,
        media_type="image/jpeg"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000)
