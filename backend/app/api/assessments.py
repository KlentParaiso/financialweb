from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assessment
from app.schemas import AssessmentCreate, AssessmentResponse
from app.services import compute_analysis

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.post("", response_model=AssessmentResponse)
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    analysis = compute_analysis(payload)
    analysis_dict = analysis.model_dump()
    payload_dict = payload.model_dump()
    row = Assessment(payload=payload_dict, analysis=analysis_dict)
    db.add(row)
    db.commit()
    db.refresh(row)
    return AssessmentResponse(id=row.public_id, analysis=analysis)


@router.get("/{public_id}", response_model=AssessmentResponse)
def get_assessment(public_id: str, db: Session = Depends(get_db)):
    row = db.query(Assessment).filter(Assessment.public_id == public_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    from app.schemas.assessment import AnalysisOutput
    analysis = AnalysisOutput(**row.analysis)
    return AssessmentResponse(id=row.public_id, analysis=analysis)
