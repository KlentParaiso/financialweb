"""
Insights API: cluster and aggregate views only. No individual records exposed.
Clustering is imported lazily to avoid loading numpy/sklearn at startup (can cause
segfaults on some Apple Silicon / Python setups).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assessment

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/clusters")
def get_clusters(
    n_clusters: int = 5,
    db: Session = Depends(get_db),
):
    """
    Spending behavior clusters from stored assessments.

    Returns anonymized cluster stats and aggregate comparisons only.
    No individual records or identifiers are exposed.

    - **n_clusters**: Number of clusters (4-6). Default 5.
    """
    from app.services.clustering import compute_clusters

    rows = db.query(Assessment).all()
    assessments = [{"payload": row.payload} for row in rows]
    result = compute_clusters(assessments, n_clusters=min(6, max(4, n_clusters)))
    return result
