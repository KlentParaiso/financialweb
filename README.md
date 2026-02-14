# PesoSense – PH Financial Health Checkup

A Philippines-first financial analysis platform: get an explainable Financial Health Score (0–100), inflation-adjusted goal projections, debt payoff comparison (Avalanche vs Snowball), and a personalized 90-day action plan. Privacy-first; no sign-up.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Next.js Route Handlers (API routes)
- **Database:** Prisma ORM + PostgreSQL
- **Validation:** Zod
- **Testing:** Vitest (financial engine)

## Prerequisites

- Node.js 18+
- pnpm or npm
- Docker (for PostgreSQL) or a hosted Postgres URL

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env and set your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

- **DATABASE_URL** – PostgreSQL connection string. Example:  
  `postgresql://finance_user:finance_pass@localhost:5432/finance_db`
- **NEXT_PUBLIC_APP_URL** (optional) – Base URL for share links, e.g. `https://yoursite.com`

### 3. Database (Docker)

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Or use `docker-compose` if that’s what you have:

```bash
docker-compose up -d postgres
```

Wait for Postgres to be healthy, then run migrations:

```bash
npx prisma migrate dev --name init
```

Generate the Prisma client (if not already done):

```bash
npx prisma generate
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

Set `DATABASE_URL` to your production PostgreSQL URL.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run test` | Run Vitest tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema (no migrations) |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXT_PUBLIC_APP_URL | No | Base URL for share links (default: current origin) |

## Sample data / testing

1. Run the app and go to [http://localhost:3000/assessment](http://localhost:3000/assessment).
2. Fill the multi-step form (use any numbers for a quick test).
3. Submit to get a share link like `/results/xxxx`.
4. Use that link to view results and test the share URL.

No seed script is required; the app works with zero records.

## Project structure

- `prisma/schema.prisma` – Database schema (Assessment model)
- `src/app/` – Next.js App Router (pages, API routes)
- `src/components/` – UI components
- `src/lib/` – Financial engine, validations, db client
- `src/content/learn/` – Learn section content (JSON)
- `tests/financial-engine/` – Vitest tests for the engine

## License

MIT
