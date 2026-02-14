"""
Seed one sample assessment for local testing.
Run from backend dir: python scripts/seed_sample.py
Requires DATABASE_URL in .env or environment.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.database import SessionLocal
from app.models import Assessment
from app.schemas.assessment import (
    AssessmentCreate,
    ProfileInput,
    IncomeInput,
    ExpensesInput,
    DebtInput,
    SavingsInput,
    InvestingInput,
    GoalInput,
)
from app.services import compute_analysis

def main():
    payload = AssessmentCreate(
        profile=ProfileInput(
            age=28,
            employment_type="stable",
            ofw_mode=False,
            is_breadwinner=True,
            number_of_dependents=2,
        ),
        income=IncomeInput(monthly_net_income=45_000, income_variability="stable"),
        expenses=ExpensesInput(
            rent=12_000,
            utilities=2_500,
            food=8_000,
            transport=3_000,
            subscriptions=500,
            discretionary=2_000,
            dependents_support=6_000,
        ),
        debt=DebtInput(items=[]),
        savings=SavingsInput(emergency_fund_amount=80_000, monthly_savings=5_000),
        investing=InvestingInput(investing_status="exploring", risk_tolerance="medium"),
        goals=[
            GoalInput(goal_type="emergency_fund", target_amount=150_000, target_years=2),
        ],
        default_inflation_rate=4.0,
        expected_return_profile="moderate",
    )
    analysis = compute_analysis(payload)
    db = SessionLocal()
    try:
        row = Assessment(
            payload=payload.model_dump(),
            analysis=analysis.model_dump(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        print(f"Created assessment with public_id: {row.public_id}")
        print(f"GET URL: /api/assessments/{row.public_id}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
