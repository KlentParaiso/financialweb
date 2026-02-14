import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Float, JSON

from app.database import Base


def generate_public_id():
    return str(uuid.uuid4())


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    public_id = Column(String(36), unique=True, index=True, default=generate_public_id)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Store raw submission (no PII beyond optional email if auth added)
    payload = Column(JSON, nullable=False)
    # Store computed analysis for GET by id
    analysis = Column(JSON, nullable=False)
