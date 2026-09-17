# RoadIQ Integration Guide

> **Member 4 — System Integration, Testing & Demo Stability**  
> This guide explains how all three components connect and how to run the complete stack.

---

## Architecture Overview

```
Browser (React / Vite)
  │  VITE_API_BASE_URL=http://localhost:8000
  ▼
FastAPI Backend  (port 8000)
  │  AI_SERVICE_URL=http://localhost:8001
  │  MONGODB_URI=mongodb://localhost:27017
  ▼
AI Microservice  (port 8001)     MongoDB (port 27017)
  │  AI_MOCK_MODE=true
  ▼
YOLO / OpenCV  (real model, optional)
```

---

## Repository Layout

```
RoadIQ/
├── RoaDIQ/
│   ├── Backend/             ← Member 2  (FastAPI)
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── database/
│   │   ├── requirements.txt
│   │   ├── seed_db.py
│   │   └── .env.example
│   └── frontend/            ← Member 1  (React + Vite + Tailwind)
│       ├── src/
│       │   ├── services/api.js   ← All API calls centralised here
│       │   ├── pages/
│       │   ├── components/
│       │   └── mock/data.js      ← Dev mock data
│       └── .env
├── ai/                      ← Member 3 + Member 4 scaffold
│   ├── main.py              ← AI microservice (port 8001)
│   ├── detector.py
│   ├── severity.py
│   ├── verification.py
│   ├── requirements.txt
│   ├── .env.example
│   └── models/              ← Drop YOLO .pt file here
└── docs/                    ← Member 4
    ├── API_CONTRACT.md
    ├── INTEGRATION_GUIDE.md  ← This file
    ├── TESTING_CHECKLIST.md
    └── DEMO_FLOW.md
```

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.10 | `python --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |
| MongoDB | 6 (local) or Atlas | `mongod --version` |
| Git | Any | `git --version` |

---

## Setup — Step by Step

### 1. Clone and enter the repository

```bash
git clone <repo-url>
cd RoadIQ
```

---

### 2. Start MongoDB

**Local MongoDB:**
```bash
mongod --dbpath /data/db
# MongoDB listens on mongodb://localhost:27017
```

**MongoDB Atlas:**  
Use your Atlas connection string in the backend `.env` file (step 3).

---

### 3. Backend Setup

```bash
cd RoaDIQ/Backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env          # Windows
# cp .env.example .env          # Mac/Linux

# Edit .env — set your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017    (local)
# MONGODB_URI=mongodb+srv://...           (Atlas)

# Seed the database with sample data (first run only)
python seed_db.py

# Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify:** Open http://localhost:8000/docs — you should see all API endpoints.

---

### 4. AI Service Setup

```bash
# In a NEW terminal from the RoadIQ root
cd ai

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env           # Windows
# cp .env.example .env           # Mac/Linux

# AI_MOCK_MODE=true by default — no model needed for demo
# To use a real model:
#   1. Uncomment ultralytics in requirements.txt and reinstall
#   2. Set AI_MOCK_MODE=false and AI_MODEL_PATH=models/your_model.pt

# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify:** Open http://localhost:8001/health

---

### 5. Frontend Setup

```bash
# In a NEW terminal
cd RoaDIQ/frontend

# Install dependencies
npm install

# Switch from mock mode to real backend:
# Edit frontend/.env:
#   VITE_API_BASE_URL=http://localhost:8000
#   VITE_USE_MOCK=false

# Start development server
npm run dev
```

**Open:** http://localhost:5173

---

## Mock Mode vs Real Backend

The frontend has a built-in mock data layer. Control it via `frontend/.env`:

| Setting | Effect |
|---|---|
| `VITE_USE_MOCK=true` | All API calls use local mock data (no backend needed) |
| `VITE_USE_MOCK=false` | All API calls go to `VITE_API_BASE_URL` (real backend) |

**For the hackathon demo:** Set `VITE_USE_MOCK=false` to show real data flow.

**Login credentials (mock):**
- Email: `admin@roadiq.gov`
- Password: `admin123`

---

## API Route Mapping

The frontend calls these URLs — all now handled by the backend:

| Frontend Call (`api.js`) | Backend Endpoint |
|---|---|
| `GET /api/dashboard/stats` | `dashboard.py` |
| `GET /api/reports` | `reports.py` |
| `POST /api/reports` | `reports.py` |
| `GET /api/reports/:id` | `reports.py` |
| `PUT /api/reports/:id/status` | `reports.py` |
| `POST /api/reports/analyze` | `reports.py` → AI service |
| `GET /api/roads` | `roads.py` (alias) |
| `GET /api/roads/:id` | `roads.py` (alias) |
| `GET /api/roads/:id/history` | `roads.py` (alias) |
| `GET /api/roads/:id/reports` | `roads.py` (alias) |
| `GET /api/priority` | `priority.py` |
| `GET /api/repairs` | `repairs.py` |
| `POST /api/repairs` | `repairs.py` |
| `PATCH /api/repairs/:id` | `repairs.py` |
| `POST /api/verify-repair` | `verification.py` → AI service |
| `GET /api/verifications` | `verification.py` |
| `GET /api/recurring-damage` | `recurring.py` |
| `GET /api/analytics` | `analytics.py` |
| `GET /api/notifications` | `notifications.py` |
| `GET /api/contributors/:id/stats` | `contributors.py` |

---

## Environment Variables Reference

### Backend (`RoaDIQ/Backend/.env`)

| Variable | Default | Required |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` | ✅ |
| `DATABASE_NAME` | `roadiq` | No |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | No |
| `AI_SERVICE_URL` | `http://localhost:8001` | No |
| `APP_ENV` | `development` | No |
| `APP_PORT` | `8000` | No |

### Frontend (`RoaDIQ/frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL |
| `VITE_USE_MOCK` | `true` | Set `false` for real backend |

### AI Service (`ai/.env`)

| Variable | Default | Description |
|---|---|---|
| `AI_MOCK_MODE` | `true` | `false` to use real YOLO model |
| `AI_MODEL_PATH` | `models/roadiq_yolo.pt` | Path to trained `.pt` file |
| `AI_CONF_THRESHOLD` | `0.35` | Minimum detection confidence |
| `AI_PORT` | `8001` | Service port |
| `AI_ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS |

---

## Connecting Member 3's Real YOLO Model

When Member 3 provides a trained model:

1. Copy the `.pt` file to `ai/models/`
2. Uncomment `ultralytics==8.2.0` in `ai/requirements.txt`
3. Run: `pip install -r requirements.txt`
4. Update `ai/.env`:
   ```
   AI_MOCK_MODE=false
   AI_MODEL_PATH=models/<your_model_name>.pt
   ```
5. Restart the AI service

The class map in `ai/detector.py` (`CLASS_MAP` dict) must match the class indices your model was trained on.

---

## Common Issues

### `RuntimeError: MONGODB_URI is missing`
→ Copy `.env.example` to `.env` in the `Backend/` directory.

### `Connection refused on port 8001`
→ The AI service is not running. Start it, or confirm `AI_SERVICE_URL` in backend `.env`.  
The backend will fall back to a dev-mock result automatically.

### Frontend shows blank / no data
→ Check `VITE_USE_MOCK` in `frontend/.env`. If `false`, verify the backend is running on port 8000.

### `CORS error` in browser console
→ Add the frontend origin to `ALLOWED_ORIGINS` in backend `.env`.

### MongoDB connection timeout
→ Confirm `mongod` is running locally, or check Atlas network access whitelist.
