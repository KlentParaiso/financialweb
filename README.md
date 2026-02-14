# Philippines Personal Finance Analysis Web App

A Philippines-first personal finance education and assessment web app. It educates users, collects questionnaire answers, computes a financial health score, inflation-adjusted goal projections, and generates a personalized action plan with PH context (breadwinner, OFW mode).

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Python FastAPI
- **Database:** PostgreSQL (Docker)
- **ORM:** SQLAlchemy
- **Testing:** pytest (scoring & projection logic)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for PostgreSQL)
- pnpm or npm

## Quick Start

### 1. Environment variables

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
# Edit: DATABASE_URL=postgresql://finance_user:finance_pass@localhost:5432/finance_db
```

**Frontend** (`frontend/.env.local`):

```bash
cp frontend/.env.local.example frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start PostgreSQL

```bash
docker-compose up -d postgres
```

Wait for Postgres to be healthy, then run migrations:

```bash
cd backend && python -m alembic upgrade head
```

### 3. Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Run frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run tests (backend)

```bash
cd backend
source .venv/bin/activate
pytest -v
```

## Docker (full stack)

To run backend + Postgres via Docker:

```bash
docker-compose up -d
```

Frontend can still run locally with `pnpm dev` and `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Project Structure

```
financialweb/
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/        # scoring, projections
│   │   └── api/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── page.tsx
│   │   ├── learn/
│   │   ├── assess/
│   │   └── results/
│   ├── components/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API

- `POST /api/assessments` — Create assessment; returns analysis and `id`.
- `GET /api/assessments/{id}` — Fetch saved analysis by ID.

## Disclaimer

This app provides **educational insights only** and is not professional financial, tax, or legal advice. Consult a licensed advisor for your situation.

## License

MIT
