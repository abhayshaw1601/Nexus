from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from ocr_engine import OCREngine
from llm_parser import LLMParser

app = FastAPI(title="NexusImpact AI Service")
ocr_engine = OCREngine()
llm_parser = LLMParser()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NexusImpact AI Service is running"}

@app.post("/api/extract")
async def extract_data(file: UploadFile = File(...)):
    contents = await file.read()
    
    # 1. Extract raw text via PaddleOCR
    raw_text = ocr_engine.extract_text_from_bytes(contents)
    
    # 2. Parse text via Gemini Flash
    structured_data = await llm_parser.parse_ocr_text(raw_text)
    
    return {
        "filename": file.filename,
        "raw_text": raw_text,
        "analysis": structured_data
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
