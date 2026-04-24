# Comprehensive Implementation Plan: NexusImpact

This document serves as the granular, developer-ready blueprint for building the NexusImpact platform. It breaks down the system into specific architectures, database schemas, API routes, and a phase-by-phase execution guide

---

## 1. System Architecture & Tech Stack

### Core Tech Stack
*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI, Framer Motion (for animations).
*   **Backend Server**: Node.js, Express.js, TypeScript.
*   **AI Microservice**: Python, FastAPI.
*   **Database**: MongoDB Atlas.
*   **Geospatial / Maps**: Mapbox GL JS.
*   **Real-time Communication**: Socket.io (Node.js) & Firebase Cloud Messaging (FCM).
*   **Authentication**: NextAuth.js (for web) + JWT (for mobile PWA APIs).
*   **Image Storage**: AWS S3 or Cloudinary.

### Microservice Architecture Pattern
Instead of a monolithic approach, we separate the AI processing from the main backend to prevent Node.js event loop blocking.

1.  **Next.js Frontend**: Handles all user interfaces (NGO Dashboard, Volunteer PWA).
2.  **Express Backend**: The "source of truth". Handles CRUD operations, database queries, volunteer matching algorithms, and auth.
3.  **FastAPI AI Service**: A lightweight Python server whose sole job is accepting an image, running PaddleOCR, running Gemini Flash, and returning JSON.

---

## 2. Recommended Monorepo Folder Structure

```text
nexus-impact/
│
├── apps/
│   ├── frontend/               # Next.js web application
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router (Pages/Layouts)
│   │   │   ├── components/     # UI Components (Shadcn)
│   │   │   ├── hooks/          # Custom React Hooks
│   │   │   └── lib/            # Utilities (Mapbox config, API calls)
│   │   └── package.json
│   │
│   ├── backend/                # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/    # Route logic
│   │   │   ├── models/         # Mongoose Schemas
│   │   │   ├── routes/         # Express routes
│   │   │   ├── services/       # Business logic (Matching, Notifications)
│   │   │   └── index.ts        # Server entry point
│   │   └── package.json
│   │
│   └── ai-service/             # Python FastAPI service
│       ├── main.py             # FastAPI entry point
│       ├── ocr_engine.py       # PaddleOCR logic
│       ├── llm_parser.py       # Gemini prompt logic
│       └── requirements.txt
│
├── package.json                # Root workspace configuration
└── README.md
```

---

## 3. Database Schema Design (Mongoose)

### A. User Model (`User.ts`)
```typescript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed
  role: { type: String, enum: ['SUPER_ADMIN', 'NGO_ADMIN', 'FIELD_WORKER', 'VOLUNTEER'], default: 'VOLUNTEER' },
  skills: [{ type: String }], // e.g., ['Medical', 'Sanitation', 'Education']
  // 2dsphere index for geospatial queries
  location: { 
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  isVerified: { type: Boolean, default: false },
  impactScore: { type: Number, default: 0 }
}
```

### B. Survey/Ingestion Model (`Survey.ts`)
```typescript
{
  fieldWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rawImageUrl: { type: String, required: true },
  status: { type: String, enum: ['PENDING_AI', 'PENDING_HUMAN', 'PROCESSED', 'REJECTED'], default: 'PENDING_AI' },
  aiExtractedData: {
    rawText: String,
    suggestedCategory: String,
    suggestedUrgency: Number,
    suggestedDescription: String
  },
  createdAt: { type: Date, default: Date.now }
}
```

### C. Task/Need Model (`Task.ts`)
```typescript
{
  sourceSurveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey' },
  category: { type: String, required: true }, // 'Medical', 'Sanitation', 'Infrastructure'
  urgencyScore: { type: Number, min: 1, max: 5, required: true },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { type: String, enum: ['OPEN', 'ASSIGNED', 'COMPLETED', 'VERIFIED'], default: 'OPEN' },
  assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  proofData: {
    imageUrl: String,
    coordinates: { type: [Number] }, // Captured via navigator.geolocation at photo time
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 4. API Endpoints Specification (Express Backend)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new user/volunteer | Public |
| **POST** | `/api/auth/login` | Authenticate and return JWT | Public |
| **POST** | `/api/surveys/upload` | Upload survey image, trigger AI service | Field Worker |
| **GET** | `/api/surveys/pending` | Fetch surveys awaiting human review | NGO Admin |
| **POST** | `/api/surveys/:id/approve`| Approve survey, creates a new Task | NGO Admin |
| **GET** | `/api/tasks` | Fetch open tasks (for heatmap mapping) | Admin/Volunteer |
| **POST** | `/api/tasks/:id/accept` | Volunteer accepts a task | Volunteer |
| **POST** | `/api/tasks/:id/complete` | Volunteer uploads proof of completion | Volunteer |

---

## 5. Phase-by-Phase Development Execution

### Phase 1: Foundation & Scaffold (Days 1-3)
1.  **Initialize Monorepo**: Set up the folder structure. Initialize `npm init -y` and configure workspaces.
2.  **Backend Setup**: Initialize Express, TypeScript, Mongoose. Connect to MongoDB Atlas. Define the 3 Schemas (`User`, `Survey`, `Task`).
3.  **Frontend Setup**: Initialize Next.js. Install Tailwind, Shadcn UI (`button`, `card`, `dialog`, `form`, `input`).
4.  **AI Service Setup**: Create FastAPI project. Install `paddlepaddle`, `paddleocr`, `google-generativeai`.

### Phase 2: The Ingestion Pipeline (Days 4-8)
1.  **Image Upload**: Implement AWS S3 or Cloudinary integration in the Node.js backend.
2.  **FastAPI OCR Endpoint**: Create `POST /extract`. Make it accept an image URL, run PaddleOCR to get text, then send that text to Gemini Flash with a strict JSON prompt: *"Extract category, urgency (1-5), and description from this text. Respond ONLY in valid JSON."*
3.  **Node.js Orchestration**: Create the `/api/surveys/upload` route. It saves the image, calls the FastAPI service, and saves the result to the database as `PENDING_HUMAN`.
4.  **Frontend HITL Dashboard**: Build the Next.js page where NGO Admins see the uploaded image on the left, and a form with AI-extracted data on the right. They edit and click "Approve".

### Phase 3: Geospatial Dashboard (Days 9-12)
1.  **Mapbox Setup**: Get a Mapbox API Key. Create a Map component in Next.js.
2.  **Heatmap Data**: Fetch tasks from `/api/tasks`. Format them as GeoJSON.
3.  **Visualization**: Add Mapbox layers. Use `urgencyScore` to determine the radius and color intensity of the heat points (Red = 5, Yellow = 1).
4.  **Privacy Filter**: If the user is not an Admin, apply a mathematical rounding function to the coordinates to slightly blur the exact location on the public view.

### Phase 4: Volunteer Matching Engine (Days 13-16)
1.  **Proximity Search**: In Node.js, when a Task is created, use MongoDB's `$near` operator:
    ```javascript
    User.find({
      role: 'VOLUNTEER',
      skills: task.category,
      location: {
        $near: {
          $geometry: task.location,
          $maxDistance: 5000 // 5km
        }
      }
    })
    ```
2.  **Real-time Alerts**: Integrate Socket.io. When a match is found, emit an event to those specific volunteer IDs.
3.  **Volunteer App View**: Build a mobile-responsive Next.js view showing "Urgent Tasks Near Me". Allow them to click "Accept Task".

### Phase 5: Verification & Closure (Days 17-21)
1.  **Camera Integration**: Build the PWA task completion screen. Use `<input type="file" accept="image/*" capture="environment">` to force the camera.
2.  **Location Capture**: Simultaneously trigger `navigator.geolocation.getCurrentPosition()` to get accurate GPS data independent of the photo's EXIF data.
3.  **Validation Logic**: Send photo + GPS to Node.js. Node.js calculates the distance between the Task coordinates and the Proof coordinates. If distance < 100 meters, update Task status to `VERIFIED`.

---

## 6. Deployment Strategy

*   **Frontend (Next.js)**: Vercel (Auto-deploys from GitHub, excellent edge caching).
*   **Backend (Node.js)**: Render.com or Railway.app (Easy Web Service deployment).
*   **AI Service (FastAPI)**: Render.com (Deploy as a Docker container to ensure PaddleOCR dependencies install correctly).
*   **Database**: MongoDB Atlas (Serverless or Dedicated cluster depending on scale).
*   **Storage**: AWS S3 or Supabase Storage for storing survey images and proof photos.

## Getting Started
To begin, we should open a terminal and run the commands to set up the **Monorepo workspace** and initialize the **Next.js frontend**. Shall we begin with Phase 1?
