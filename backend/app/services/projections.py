"""
Inflation-adjusted goal projections.
Formula: inflation_adjusted_target = target_amount_today * (1 + inflation_rate/100)^years
Required monthly contribution computed with FV of annuity: FV = PMT * (((1+r)^n - 1) / r)
So: PMT = FV / (((1+r)^n - 1) / r) where r = monthly return, n = months.
"""

from app.schemas.assessment import (
    GoalInput,
    GoalProjectionResult,
    GoalProjectionScenario,
)


# Annual return assumptions (before inflation); user picks profile
CONSERVATIVE_ANNUAL_RETURN = 0.04   # e.g. time deposit / bonds
MODERATE_ANNUAL_RETURN = 0.07       # e.g. mixed UITF
AGGRESSIVE_ANNUAL_RETURN = 0.10     # e.g. equity-heavy


def _monthly_contribution_for_target(
    future_value: float,
    years: float,
    annual_return: float,
) -> float:
    """
    FV = PMT * (((1+r)^n - 1) / r)  with r = monthly rate, n = months.
    So PMT = FV * r / ((1+r)^n - 1). Avoid division by zero when r=0.
    """
    n_months = max(1, int(years * 12))
    r_annual = annual_return
    r_monthly = r_annual / 12.0
    if r_monthly <= 0:
        return future_value / n_months
    factor = (1 + r_monthly) ** n_months - 1
    if factor <= 0:
        return future_value / n_months
    pmt = future_value * r_monthly / factor
    return pmt


def _future_value_of_contributions(
    monthly_pmt: float,
    years: float,
    annual_return: float,
) -> float:
    """FV of annuity: PMT * (((1+r)^n - 1) / r)."""
    n_months = max(1, int(years * 12))
    r_monthly = annual_return / 12.0
    if r_monthly <= 0:
        return monthly_pmt * n_months
    fv = monthly_pmt * (((1 + r_monthly) ** n_months - 1) / r_monthly)
    return fv


def compute_goal_projections(
    goals: list[GoalInput],
    inflation_rate_pct: float,
    return_profile: str,
) -> list[GoalProjectionResult]:
    """
    For each goal: compute inflation-adjusted target, then 3 scenarios
    (conservative / moderate / aggressive) with required monthly contribution
    and resulting FV vs target.
    """
    if inflation_rate_pct < 0:
        inflation_rate_pct = 3.5
    inflation_dec = inflation_rate_pct / 100.0

    returns = {
        "conservative": CONSERVATIVE_ANNUAL_RETURN,
        "moderate": MODERATE_ANNUAL_RETURN,
        "aggressive": AGGRESSIVE_ANNUAL_RETURN,
    }
    annual_return = returns.get(return_profile, MODERATE_ANNUAL_RETURN)

    results = []
    for g in goals:
        years = max(0.5, g.target_years)
        # Inflation-adjusted target at end of period
        inflation_adjusted = g.target_amount * ((1 + inflation_dec) ** years)
        scenarios = []

        for label, ret in [
            ("Conservative", CONSERVATIVE_ANNUAL_RETURN),
            ("Moderate", MODERATE_ANNUAL_RETURN),
            ("Aggressive", AGGRESSIVE_ANNUAL_RETURN),
        ]:
            monthly = _monthly_contribution_for_target(
                inflation_adjusted,
                years,
                ret,
            )
            total_contrib = monthly * years * 12
            fv = _future_value_of_contributions(monthly, years, ret)
            shortfall = inflation_adjusted - fv
            scenarios.append(
                GoalProjectionScenario(
                    label=label,
                    monthly_contribution=round(monthly, 2),
                    total_contribution=round(total_contrib, 2),
                    future_value=round(fv, 2),
                    inflation_adjusted_target=round(inflation_adjusted, 2),
                    shortfall_or_surplus=round(shortfall, 2),
                )
            )

        results.append(
            GoalProjectionResult(
                goal_type=g.goal_type,
                target_amount_today=g.target_amount,
                target_years=years,
                inflation_rate=inflation_rate_pct,
                inflation_adjusted_target=round(inflation_adjusted, 2),
                scenarios=scenarios,
            )
        )
    return results
