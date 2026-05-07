import io
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image
from pypdf import PdfReader, PdfWriter

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

MAX_FILES = 30
MAX_FILE_MB = 50

app = FastAPI(title="FácilPDF API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your domain: https://tudominio.com
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

subscribers = set()


def validate_email(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Email inválido")


def safe_name(filename: str) -> str:
    return Path(filename).name.replace(" ", "_")


def ensure_size(file: UploadFile) -> None:
    # FastAPI streams files; size check is done after reading in process endpoint.
    if not file.filename:
        raise HTTPException(status_code=400, detail="Archivo sin nombre")


def image_to_pdf_bytes(data: bytes, quality: int = 85, max_side: int = 1600) -> bytes:
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="PDF", resolution=100.0, quality=quality, optimize=True)
    return output.getvalue()


def compress_pdf_basic(input_path: Path, output_path: Path, target_mb: float = 1.0) -> Path:
    """
    Basic safe compression pass. This rewrites PDF streams.
    For image-heavy scanned PDFs, strongest compression is achieved by uploading images
    and converting them with lower quality/max_side.
    """
    reader = PdfReader(str(input_path))
    writer = PdfWriter()
    for page in reader.pages:
        try:
            page.compress_content_streams()
        except Exception:
            pass
        writer.add_page(page)
    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def merge_files_to_pdf(files_payload: List[tuple], output_path: Path, mode: str) -> Path:
    writer = PdfWriter()

    quality = 88
    max_side = 1800
    if mode == "compress_1mb":
        quality = 45
        max_side = 1100

    for filename, content_type, data in files_payload:
        suffix = Path(filename).suffix.lower()
        if content_type == "application/pdf" or suffix == ".pdf":
            temp_pdf = UPLOAD_DIR / f"{uuid.uuid4()}_{safe_name(filename)}"
            temp_pdf.write_bytes(data)
            try:
                reader = PdfReader(str(temp_pdf))
                for page in reader.pages:
                    try:
                        page.compress_content_streams()
                    except Exception:
                        pass
                    writer.add_page(page)
            finally:
                temp_pdf.unlink(missing_ok=True)
        elif content_type in ["image/jpeg", "image/png", "image/jpg"] or suffix in [".jpg", ".jpeg", ".png"]:
            pdf_data = image_to_pdf_bytes(data, quality=quality, max_side=max_side)
            reader = PdfReader(io.BytesIO(pdf_data))
            for page in reader.pages:
                writer.add_page(page)
        else:
            raise HTTPException(status_code=400, detail=f"Formato no permitido: {filename}")

    if len(writer.pages) == 0:
        raise HTTPException(status_code=400, detail="No hay páginas para generar PDF")

    with open(output_path, "wb") as f:
        writer.write(f)

    if mode == "compress_1mb":
        compressed_path = output_path.with_name(output_path.stem + "_compressed.pdf")
        compress_pdf_basic(output_path, compressed_path, 1.0)
        output_path.unlink(missing_ok=True)
        return compressed_path

    return output_path


@app.get("/")
def health():
    return {"status": "ok", "app": "FácilPDF API"}


@app.post("/subscribe")
def subscribe(email: str = Form(...)):
    validate_email(email)
    subscribers.add(email.lower().strip())
    return {"ok": True, "message": "Suscripción gratuita activada"}


@app.post("/process")
async def process_files(
    email: str = Form(...),
    mode: str = Form("merge_all"),
    files: List[UploadFile] = File(...),
):
    validate_email(email)
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Máximo {MAX_FILES} archivos")

    payload = []
    for f in files:
        ensure_size(f)
        data = await f.read()
        size_mb = len(data) / 1024 / 1024
        if size_mb > MAX_FILE_MB:
            raise HTTPException(status_code=400, detail=f"{f.filename} pesa más de {MAX_FILE_MB} MB")
        payload.append((f.filename, f.content_type, data))

    out_name = f"facilpdf_{uuid.uuid4().hex}.pdf"
    output_path = OUTPUT_DIR / out_name
    final_path = merge_files_to_pdf(payload, output_path, mode)

    return JSONResponse({
        "ok": True,
        "download_url": f"/download/{final_path.name}",
        "filename": final_path.name,
        "size_mb": round(final_path.stat().st_size / 1024 / 1024, 2),
        "note": "Si un PDF escaneado con muchas fotos no baja a 1 MB, sube las imágenes originales y usa Comprimir a 1 MB."
    })


@app.get("/download/{filename}")
def download(filename: str):
    path = OUTPUT_DIR / safe_name(filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path, media_type="application/pdf", filename="facilpdf_resultado.pdf")
