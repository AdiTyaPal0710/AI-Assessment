# VedaAI – Full Stack AI Assessment Creator

VedaAI is an state-of-the-art AI-powered assessment creation system built for teachers. It enables teachers to configure assignment specifications (due dates, custom question types, question counts, difficulty balance, marks weightage, reference files, and extra parameters), generates structured academic question papers using advanced AI modeling, and presents the output in a premium exam-paper sheet with PDF exports, regeneration pipelines, and real-time status notifications.

## Key Features

1. **Assignment Specifications Form**: Premium dynamic multi-step form built with interactive steppers, validation rules, drag-and-drop file upload visuals, and real-time summaries.
2. **AI Question Generator**: Translates configuration details into high-quality exam papers containing sections, questions, marks, and detailed answer keys.
3. **Structured UI Layout**: Replicates official exam structures with student details (Name, Roll No, Section) and distinct styled sections.
4. **BullMQ Queuing system**: Decouples API requests from background jobs for robust AI processing.
5. **Real-time Updates**: Real-time status notifications via WebSockets.
6. **Smart Fallback Engine**: Instantly falls back to a highly realistic local academic generator if the Gemini API Key is not set or rate-limited.
7. **Premium PDF Exporter**: High-fidelity PDF generation utilizing exact desktop margins and font metrics.
8. **Redis Cache**: Caches generated question papers for instantaneous page loads.

---

## Tech Stack

*   **Frontend**: Next.js 14+ (App Router), TypeScript, Zustand (State Management), Native WebSockets, Vanilla CSS.
*   **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (ioredis), BullMQ (Queue Management), ws (WebSockets).
*   **AI**: Google Gemini API (gemini-2.0-flash).

---

## Architecture Overview

```
                               ┌──────────────────┐
                               │     Browser      │
                               │  (Next.js App)   │
                               └────────┬─────────┘
                                        │ (HTTP / WS)
                                        ▼
                               ┌──────────────────┐
                               │  Express Server  │
                               └────────┬─────────┘
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
              ┌──────────────────┐              ┌──────────────────┐
              │     MongoDB      │              │      Redis       │
              │  (Assignments)   │              │     (BullMQ)     │
              └──────────────────┘              └────────┬─────────┘
                                                         │
                                                         ▼
                                                ┌──────────────────┐
                                                │  BullMQ Worker   │
                                                └────────┬─────────┘
                                                         │
                                                ┌────────┴────────┐
                                                ▼                 ▼
                                          ┌──────────┐      ┌───────────┐
                                          │  Gemini  │      │ Academic  │
                                          │  Flash   │      │ Fallback  │
                                          └──────────┘      └───────────┘
```

---

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm
*   MongoDB running locally (`mongodb://localhost:27017`)
*   Redis running locally (`redis://localhost:6379`)

---

### Installation & Setup

#### 1. Clone the repository and install dependencies

##### Backend Setup:
```bash
cd backend
npm install
```

##### Frontend Setup:
```bash
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

##### Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:3000
```

##### Frontend (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

---

### Running the Application

1.  **Start Backend Server**:
    ```bash
    cd backend
    npm run dev
    ```

2.  **Start Frontend Server**:
    ```bash
    cd frontend
    npm run dev
    ```

3.  Open browser to `http://localhost:3000` to interact with VedaAI!
