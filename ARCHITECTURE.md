# PesoSense – PH Financial Health Checkup

## Architecture & File Tree

```
financialweb/
├── prisma/
│   └── schema.prisma              # Assessment model, PostgreSQL
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing
│   │   ├── globals.css
│   │   ├── learn/
│   │   │   ├── page.tsx           # Learn hub
│   │   │   └── [slug]/page.tsx    # Learn article
│   │   ├── assessment/page.tsx    # Multi-step form
│   │   ├── results/[shareToken]/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── disclaimer/page.tsx
│   │   └── api/
│   │       ├── assessments/route.ts           # POST
│   │       └── assessments/[shareToken]/route.ts  # GET
│   ├── components/
│   │   ├── ui/                    # ShadCN-style primitives
│   │   ├── landing/               # Hero, features, FAQ, CTA
│   │   ├── assessment/            # Stepper, steps, form fields
│   │   └── results/               # Score card, charts, action plan, share
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── validations.ts         # Zod schemas
│   │   ├── utils.ts
│   │   └── financial-engine/
│   │       ├── index.ts           # Public API
│   │       ├── metrics.ts         # Savings rate, expense ratio, DTI, EF months
│   │       ├── score.ts           # Health score 0–100, grade, dimensions
│   │       ├── goals.ts           # Inflation-adjusted projection, monthly contrib
│   │       ├── debt-simulator.ts  # Avalanche vs Snowball
│   │       └── action-plan.ts     # 90-day plan (this week / month / 3 months)
│   └── content/
│       └── learn/                 # JSON or MD for learn pages
├── tests/
│   └── financial-engine/          # Vitest tests
├── public/
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── .env.example
├── docker-compose.yml             # PostgreSQL
└── README.md
```

## Tech Stack

| Layer        | Choice |
|-------------|--------|
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind, Recharts |
| Design      | ShadCN-style (neutral, rounded-xl, soft shadows) |
| Backend     | Next.js Route Handlers |
| DB          | Prisma + PostgreSQL (Docker) |
| Validation  | Zod |
| Testing     | Vitest (financial engine) |

## Data Flow

1. **POST /api/assessments**: Body validated with Zod → run financial engine → save to DB → return `{ shareToken }`.
2. **GET /api/assessments/[shareToken]**: Load assessment → return `{ payloadJson, analysisJson }`.
3. **Results page**: Fetch by shareToken, render score, charts, action plan, share link.

## Financial Engine Modules

- **metrics.ts**: savingsRate, expenseRatio, debtToIncomeRatio, emergencyFundMonths (PH rules).
- **score.ts**: weighted score 0–100, grade A–F, perDimensionScores, short explanation.
- **goals.ts**: inflation-adjusted target, monthly contribution (3 scenarios), data series for chart.
- **debt-simulator.ts**: avalanche & snowball → months to debt-free, total interest, comparison.
- **action-plan.ts**: personalized items for This Week / This Month / Next 3 Months with numeric targets.

## Implementation Order

1. Database (Prisma schema, migrate)
2. Financial engine + Vitest tests
3. API routes (Zod + engine + Prisma)
4. UI components (design system, forms, charts)
5. Pages (landing, learn, assessment, results, privacy, disclaimer)
6. Polish, README, Docker, env docs
