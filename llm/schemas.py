"""Validated JSON contracts exchanged with grading providers."""

from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class MatchedPoint(BaseModel):
    rubric_point: str
    marks_awarded: Decimal = Field(ge=0)
    student_quote: str = ""
    page_no: int | None = Field(default=None, ge=1)
    bbox: list[float] = Field(default_factory=list)
    explanation: str


class MissingPoint(BaseModel):
    concept: str
    marks_lost: Decimal = Field(ge=0)
    explanation: str


class EvidenceReference(BaseModel):
    chunk_id: int | None = None
    document_name: str
    page_no: int | None = Field(default=None, ge=1)
    text: str


class QuestionGrade(BaseModel):
    marks_awarded: Decimal = Field(ge=0)
    matched_points: list[MatchedPoint] = Field(default_factory=list)
    missing_points: list[MissingPoint] = Field(default_factory=list)
    evidence: list[EvidenceReference] = Field(default_factory=list)
    reasoning: str
    confidence: float = Field(ge=0, le=1)
    uncertain_reason: str | None = None

    @field_validator("confidence")
    @classmethod
    def confidence_is_finite(cls, value):
        if value != value:
            raise ValueError("confidence must be finite")
        return value
