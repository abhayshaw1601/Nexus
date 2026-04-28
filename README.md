# NexusImpact

## [Project Overview]

> An advanced, AI-powered community response platform designed to bridge the gap between offline field surveys and digital crisis management through intelligent document digitization and geospatial analysis.

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0-339933?logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary)](https://cloudinary.com/)

## Overview

NexusImpact is a comprehensive solution for NGOs and community responders to digitize handwritten field surveys at scale. By leveraging a multimodal AI pipeline, the platform converts physical survey forms into structured, actionable data points, complete with geospatial coordinates and urgency scoring.

### Core Features

- **Multi-Entry AI Digitization** - Automatically identifies and extracts multiple survey records from a single document or image.
- **Handwriting OCR** - Specialized Indic-language handwriting recognition powered by Sarvam AI and Docling.
- **Geospatial Heatmaps** - Real-time visualization of community needs categorized by urgency and location.
- **Verification Workflow** - Dual-pane review interface allowing human-in-the-loop validation of AI-extracted data.
- **Automated Task Creation** - One-click conversion of verified surveys into actionable response tasks for volunteers.
- **Cloud Infrastructure** - Robust document storage and management using Cloudinary.

## Architecture

```mermaid
graph TB
    subgraph "Frontend Layer (Next.js)"
        A[Verification Dashboard]
        B[Survey Upload Flow]
        C[Geospatial Heatmap]
        D[Neo-brutalism UI Component Library]
    end
    
    subgraph "Backend Layer (Express.js)"
        E[API Gateway]
        F[JWT Authentication]
        G[Survey Controller]
        H[Task Management Engine]
    end
    
    subgraph "AI Microservice (FastAPI)"
        I[Docling Layout Analyzer]
        J[Sarvam AI Indic OCR]
        K[Gemini 2.5 Flash Lite Parser]
        L[Multi-Entry Processor]
    end
    
    subgraph "Cloud & Database"
        M[(MongoDB Atlas)]
        N[Cloudinary Image Store]
    end
    
    A --> E
    B --> E
    E --> G
    G --> I
    I --> J
    J --> K
    K --> L
    L --> G
    G --> M
    G --> N
    
    style K fill:#8e75b2,color:#fff
    style G fill:#339933,color:#fff
    style A fill:#008080,color:#fff
```

## AI Pipeline Flow

The platform employs a sophisticated three-stage pipeline to handle complex handwritten documents:

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Cloudinary
    participant AIService
    participant Gemini
    
    User->>Backend: Upload Survey Image
    Backend->>Cloudinary: Store Image & Get URL
    Backend->>AIService: Trigger Extraction (image_url)
    AIService->>AIService: Docling: Analyze Document Layout
    AIService->>AIService: Sarvam AI: Indications Handwriting OCR
    AIService->>Gemini: Parse OCR text into structured JSON list
    Gemini-->>AIService: Validated Survey Data (Category, Urgency, GPS)
    AIService-->>Backend: Final Survey Object List
    Backend->>User: Redirect to Verification Page
```

### AI Capabilities

**Indic Handwriting Intelligence**
- Support for multiple regional languages including Hindi and local dialects.
- Advanced layout analysis to distinguish between headers, labels, and handwritten content.

**Multi-Entry Extraction**
- Detects recurring patterns in documents to identify separate survey entries.
- Automatically normalizes coordinates (Latitude/Longitude) found in text.

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ SURVEYS : "uploads"
    NGOS ||--o{ USERS : "manages"
    SURVEYS ||--o{ TASKS : "generates"
    
    SURVEYS {
        string id PK
        string rawImageUrl
        string status "DRAFT | SUBMITTED | VERIFIED"
        array extractedEntries
        object aiExtractedData
        date createdAt
    }
    
    TASKS {
        string id PK
        string category
        number urgencyScore
        string description
        object location "Point"
        string status "OPEN | IN_PROGRESS | COMPLETED"
    }
    
    USERS {
        string id PK
        string role "FIELD_WORKER | NGO_ADMIN | VOLUNTEER"
        string ngoId FK
    }
```

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** (Neo-brutalism design system)
- **Leaflet & Recharts** (Visualization)
- **Lucide React** (Iconography)

### Backend
- **Node.js & Express**
- **MongoDB & Mongoose**
- **Cloudinary SDK** (Media Management)
- **Socket.io** (Real-time updates)

### AI Service
- **Python 3.10+**
- **FastAPI**
- **Docling** (Document Layout)
- **Sarvam AI SDK** (OCR)
- **Google Generative AI** (Gemini 1.5)

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance
- Cloudinary Account
- Google Gemini API Key
- Sarvam AI API Key

### Environment Configuration

**Backend (`apps/backend/.env`)**
```bash
PORT=5000
MONGODB_URI="your_mongodb_uri"
JWT_SECRET="your_secret"
CLOUDINARY_CLOUD_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"
AI_SERVICE_URL="http://localhost:8000"
```

**AI Service (`apps/ai-service/.env`)**
```bash
GEMINI_API_KEY="your_google_key"
SARVAM_API_KEY="your_sarvam_key"
PORT=8000
```

### Execution Steps

```bash
# 1. Start the AI Service
cd apps/ai-service
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Start the Backend
cd ../backend
npm install
npm run dev

# 3. Start the Frontend
cd ../frontend
npm install
npm run dev
```
