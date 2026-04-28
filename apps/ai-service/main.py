from fastapi import FastAPI, UploadFile, File, Form
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

dotenv.load_dotenv()

app = FastAPI(title="NexusImpact AI Service")
converter = DocumentConverter()
sarvam = SarvamAI(api_subscription_key=os.getenv("sarvam_api"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NexusImpact AI Service is running (Docling + Sarvam + LangExtract)"}


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
        print(f"Reading uploaded file: {file.filename}")
        file_bytes = await file.read()
        filename = file.filename
    elif image_url:
        print(f"Fetching remote image: {image_url}")
        import requests
        response = requests.get(image_url)
        file_bytes = response.content
        filename = os.path.basename(image_url)
    else:
        return {"error": "No file or image_url provided"}

    # ── STAGE 1: Docling – Layout Analysis ────────────────────────────────────
    print("[1/3] Converting document layout with Docling...")
    source = DocumentStream(name=filename, stream=io.BytesIO(file_bytes))
    result = await asyncio.to_thread(converter.convert, source)
    layout_md = result.document.export_to_markdown()
    print("      Layout conversion complete.")

    # ── STAGE 2: Sarvam AI – Handwriting OCR ──────────────────────────────────
    print("[2/3] Extracting handwriting with Sarvam AI...")

    # Create a temporary file because the SDK's upload_file expects a path
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
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
        print("      Job started. Waiting for Sarvam AI processing...")
        await asyncio.to_thread(job.wait_until_complete)

        output_path = "sarvam_result.zip"
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
        # Fallback to Docling layout text if Sarvam fails
        print(f"      Sarvam AI error: {sarvam_error}. Falling back to Docling output.")
        ocr_text = layout_md
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    print(f"      OCR Extraction complete. Preview: {str(ocr_text)[:150]}...")

    # ── STAGE 3: LangExtract + Gemini – JSON Structuring ──────────────────────
    print("[3/3] Structuring data into JSON with LangExtract...")
    
    schema = {
        "surveys": "list of objects containing: {category, urgency, latitude, longitude, description}"
    }

    example = lx.data.ExampleData(
        text="1) Sanitation, Urgency: 4, Lat: 15.48, Lng: 77.42, Blockage in draining system. 2) Medical, Urgency: 5, Lat: 64, Lng: 61, Some mislennous issue.",
        extractions=[
            lx.data.Extraction(extraction_class="surveys", extraction_text='[{"category": "Sanitation", "urgency": 4, "latitude": "15.48", "longitude": "77.42", "description": "Blockage in draining system"}, {"category": "Medical", "urgency": 5, "latitude": "64", "longitude": "61", "description": "Some mislennous issue"}]', group_index=0),
        ]
    )

    extraction_result = lx.extract(
        ocr_text,
        prompt_description=f"Extract multiple survey entries from the text. For each entry, identify the category (Sanitation, Medical, Education, Infrastructure, Other), urgency (1-5), latitude, longitude, and description. Return a list of survey objects. Text: {ocr_text}",
        examples=[example],
        model_id="gemini-2.5-flash-lite",
        api_key=os.getenv("GEMINI_API_KEY")
    )

    import json
    surveys = []
    try:
        doc = extraction_result[0] if isinstance(extraction_result, list) else extraction_result
        if doc and doc.extractions:
            raw_val = doc.extractions[0].extraction_text
            # LangExtract might return a string representation of the list
            if isinstance(raw_val, str):
                surveys = json.loads(raw_val)
            else:
                surveys = raw_val
    except Exception as e:
        print(f"Error parsing extractions: {e}")
        # Fallback parsing logic if needed
        surveys = []

    print("--- Processing complete! ---")
    return {"surveys": surveys, "raw_ocr_text": ocr_text[:1000]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
