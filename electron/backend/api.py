from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
import cv2
import os
from insightface.app import FaceAnalysis


# ==============================
# DATABASE CONFIG
# ==============================
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "BcsFaceFinder",
    "user": "postgres",
    "password": "blinkpostgresql"
}

NAS_ROOT = "/Volumes/BCS 2024/Sample Folder"

# ==============================
# FASTAPI SETUP
# ==============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(
        **DB_CONFIG,
        cursor_factory=RealDictCursor
    )

# ==============================
# FACE RECOGNITION SETUP
# ==============================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

face_app = FaceAnalysis(
    name="buffalo_l",
    root=MODEL_DIR,
    providers=["CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0)

# ==============================
# HELPERS
# ==============================
def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def parse_vector(v):
    """
    Robust parser for embeddings stored as:
    - "{0.1, 0.2, ...}"
    - "[0.1, 0.2, ...]"
    - "0.1,0.2,0.3"
    - Python list
    """
    if isinstance(v, list):
        # Already a Python list
        return np.array(v, dtype=float)

    if isinstance(v, str):
        cleaned = v.strip()

        # Remove outer brackets {} or []
        if cleaned.startswith("{") and cleaned.endswith("}"):
            cleaned = cleaned[1:-1]
        elif cleaned.startswith("[") and cleaned.endswith("]"):
            cleaned = cleaned[1:-1]

        # Split by comma
        parts = cleaned.split(",")

        floats = []
        for p in parts:
            p = p.strip()
            if p == "":
                continue
            floats.append(float(p))

        return np.array(floats, dtype=float)

    raise ValueError(f"Unknown embedding format: {type(v)}")


# ==============================
# GET FOLDERS
# ==============================
@app.get("/folders")
def get_folders():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, parent_id, file_path
        FROM folders
        ORDER BY parent_id NULLS FIRST, name
    """)

    items = cursor.fetchall()
    conn.close()
    return {"folders": items}

# ==============================
# FACE SEARCH API
# ==============================
@app.post("/face-search")
async def face_search(image: UploadFile = File(...), folder_ids: str = Form(...)):
    folder_ids = [int(x) for x in folder_ids.split(",") if x]

    # Read uploaded image
    contents = await image.read()
    img_np = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)

    faces = face_app.get(img)
    if not faces:
        return {"matches": [], "total_matches": 0}

    # Pick largest face
    face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
    ref_embedding = face.embedding.astype(float)

    conn = get_db()
    cursor = conn.cursor()

    sql = """
    WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE id = ANY(%s)
        UNION ALL
        SELECT f.id FROM folders f
        JOIN folder_tree ft ON ft.id = f.parent_id
    )
    SELECT 
        fe.file_id,
        fe.embedding,
        nf.file_name,
        nf.file_path
    FROM face_embeddings fe
    JOIN nas_files nf ON fe.file_id = nf.id
    WHERE nf.folder_id IN (SELECT id FROM folder_tree)
    """

    cursor.execute(sql, (folder_ids,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    THRESH = 0.30  # more lenient threshold for better matches

    for r in rows:
        db_emb = parse_vector(r["embedding"])
        score = cosine_similarity(ref_embedding, db_emb)

        if score >= THRESH:
            results.append({
                "file_id": r["file_id"],
                "file_name": r["file_name"],
                "file_path": r["file_path"],
                "similarity": score
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return {"matches": results, "total_matches": len(results)}

# ==============================
# SERVE IMAGE FROM NAS
# ==============================
@app.get("/image/{file_id}")
def get_image(file_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT file_path FROM nas_files WHERE id = %s", (file_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"error": "Not found"}

    file_path = row["file_path"]

    if not os.path.exists(file_path):
        return {"error": "NAS file missing"}

    return FileResponse(file_path)
