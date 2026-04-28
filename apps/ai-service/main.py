from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from docling.document_converter import DocumentConverter
from sarvamai import SarvamAI
import langextract as lx
import dotenv
import os
import asyncio
from docling.datamodel.base_models import DocumentStream
import io
import tempfile
import zipfile
import json
from typing import List, Optional
from pydantic import BaseModel

dotenv.load_dotenv()

app = FastAPI(title="NexusImpact AI Service")
converter = DocumentConverter()
sarvam = SarvamAI(api_subscription_key=os.getenv("sarvam_api"))

class SurveyEntry(BaseModel):
    category: str
    urgency: int
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    description: str

@app.get("/")
async def root():
    return {"message": "NexusImpact AI Service is running (Docling + Sarvam + LangExtract)"}

async def get_ocr_text(file_bytes: bytes, filename: str, language: str) -> str:
    """Stage 2: Extract text using Sarvam AI or fallback to Docling."""
    # Create a temporary file because the SDK's upload_file expects a path
    suffix = os.path.splitext(filename)[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    ocr_text = ""
    try:
        job = sarvam.document_intelligence.create_job(
            language=language,
            output_format="md"
        )
        job.upload_file(tmp_path)
        job.start()
        print(f"      Sarvam Job {job.job_id} started...")
        await asyncio.to_thread(job.wait_until_complete)

        output_path = f"result_{job.job_id}.zip"
        job.download_output(output_path)

        if zipfile.is_zipfile(output_path):
            with zipfile.ZipFile(output_path, 'r') as zip_ref:
                md_files = [f for f in zip_ref.namelist() if f.endswith('.md')]
                if md_files:
                    with zip_ref.open(md_files[0]) as f:
                        ocr_text = f.read().decode("utf-8", errors="ignore")
                else:
                    with zip_ref.open(zip_ref.namelist()[0]) as f:
                        ocr_text = f.read().decode("utf-8", errors="ignore")
        else:
            with open(output_path, "r", encoding="utf-8", errors="ignore") as f:
                ocr_text = f.read()

        if os.path.exists(output_path):
            os.remove(output_path)

    except Exception as sarvam_error:
        print(f"      Sarvam AI error: {sarvam_error}. Falling back to layout analysis.")
        # We don't have layout_md here, so we'll return empty and let the caller handle it
        return ""
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    
    return ocr_text

async def structure_data(ocr_text: str) -> List[dict]:
    """Stage 3: Use LangExtract + Gemini to structure the OCR text."""
    if not ocr_text.strip():
        return []

    example = lx.data.ExampleData(
        text="1) Sanitation, Urgency: 4, Lat: 15.48, Lng: 77.42, Blockage in draining system.",
        extractions=[
            lx.data.Extraction(
                extraction_class="surveys", 
                extraction_text='[{"category": "Sanitation", "urgency": 4, "latitude": "15.48", "longitude": "77.42", "description": "Blockage in draining system"}]', 
                group_index=0
            ),
        ]
    )

    try:
        extraction_result = lx.extract(
            ocr_text,
            prompt_description="Extract multiple survey entries. For each, identify category, urgency (1-5), latitude, longitude, and description.",
            examples=[example],
            model_id="gemini-2.5-flash-lite", # Fixed model ID
            api_key=os.getenv("GEMINI_API_KEY")
        )

        doc = extraction_result[0] if isinstance(extraction_result, list) else extraction_result
        if doc and doc.extractions:
            raw_val = doc.extractions[0].extraction_text
            if isinstance(raw_val, str):
                return json.loads(raw_val)
            return raw_val
    except Exception as e:
        print(f"      Structuring error: {e}")
        return []
    
    return []


@app.post("/extract-survey")
async def extract_survey(
    file: UploadFile = File(None), 
    language: str = Form("hi-IN"),
    image_url: str = Form(None)
):
    print(f"--- Processing new request (Language: {language}) ---")

    file_bytes = None
    filename = "document"

    if file:
        file_bytes = await file.read()
        filename = file.filename
    elif image_url:
        import requests
        response = requests.get(image_url)
        file_bytes = response.content
        filename = os.path.basename(image_url)
    else:
        raise HTTPException(status_code=400, detail="No file or image_url provided")

    # ── STAGE 1: Docling – Layout Analysis ────────────────────────────────────
    print("[1/3] Converting document layout with Docling...")
    source = DocumentStream(name=filename, stream=io.BytesIO(file_bytes))
    result = await asyncio.to_thread(converter.convert, source)
    layout_md = result.document.export_to_markdown()

    # ── STAGE 2: Sarvam AI – Handwriting OCR ──────────────────────────────────
    print("[2/3] Extracting handwriting with Sarvam AI...")
    ocr_text = await get_ocr_text(file_bytes, filename, language)
    
    if not ocr_text:
        print("      Falling back to Docling layout text.")
        ocr_text = layout_md

    # ── STAGE 3: LangExtract + Gemini – JSON Structuring ──────────────────────
    print("[3/3] Structuring data into JSON with LangExtract...")
    surveys = await structure_data(ocr_text)

    print(f"--- Processing complete! Found {len(surveys)} entries. ---")
    return {
        "surveys": surveys, 
        "raw_ocr_text": ocr_text[:1000],
        "status": "success"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
