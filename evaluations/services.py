import json
import logging
import os
import re
import mimetypes
from decimal import Decimal
from django.utils import timezone
from google import genai
from google.genai import types
from google.genai.errors import APIError
from .models import Evaluation
from questions.models import SubjectResource
from submissions.models import UploadedAnswerSheet

logger = logging.getLogger(__name__)


class EvaluationServiceError(Exception):
    """Custom exception raised when AI evaluation encounters an error."""

    pass


def parse_ai_json_response(raw_text: str) -> dict:
    """
    Extracts and parses JSON object from AI model response text,
    stripping markdown fences if present.
    """
    if not raw_text or not raw_text.strip():
        raise EvaluationServiceError("Empty response received from Gemini AI.")

    cleaned = raw_text.strip()
    # Strip markdown ```json ... ``` or ``` ... ```
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Fallback regex search for JSON object
        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        logger.error("Failed to parse JSON from AI response: %s", raw_text)
        raise EvaluationServiceError(
            f"Failed to parse structured JSON from AI response: {e}"
        )


def evaluate_submission(submission) -> Evaluation:
    """
    Evaluates a student's answer using Google Gemini AI.
    Performs semantic analysis against the reference answer and marking rubric.
    Generates explainable scoring breakdown, identified concepts, feedback, and confidence.
    """
    # 1. Prevent duplicate evaluations
    if hasattr(submission, "evaluation") and submission.evaluation is not None:
        raise EvaluationServiceError(
            "This submission has already been evaluated. Duplicate evaluations are prevented."
        )

    # 2. Check Gemini API configuration
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise EvaluationServiceError(
            "GEMINI_API_KEY is not configured in the backend environment. Please set GEMINI_API_KEY."
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    # 3. Prepare evaluation context
    question = submission.question
    max_marks_float = float(question.max_marks)
    rubric_text = (
        question.marking_rubric.strip()
        if question.marking_rubric
        else "Evaluate fairly based on clarity, correctness, completeness, and conceptual accuracy."
    )

    subject_resource = SubjectResource.objects.filter(
        teacher=question.teacher, name=question.subject
    ).first()
    question_paper = None
    if subject_resource:
        question_paper = UploadedAnswerSheet.objects.filter(
            subject=subject_resource,
            document_type=UploadedAnswerSheet.DocumentType.QUESTION_PAPER,
        ).order_by("-uploaded_at").first()

    def document_part(document):
        if not document or not document.name:
            return None
        try:
            document.open("rb")
            raw = document.read()
            document.close()
            mime_type = mimetypes.guess_type(document.name)[0] or "application/octet-stream"
            return types.Part.from_bytes(data=raw, mime_type=mime_type)
        except Exception as exc:
            logger.warning("Could not read evaluation document %s: %s", document.name, exc)
            return None

    reference_document = document_part(subject_resource.reference_notes) if subject_resource else None
    question_document = document_part(question_paper.document) if question_paper else None
    answer_document = document_part(submission.answer_document)
    reference_context = (
        subject_resource.notes_description.strip()
        if subject_resource and subject_resource.notes_description
        else "Use the attached common subject reference document."
    )

    prompt = f"""You are EvalAI, an expert, objective, pedagogical evaluator and academic grader.
Evaluate the student's descriptive answer by performing semantic analysis against the question, reference answer, and marking rubric.

Question Title: {question.title}
Subject: {question.subject}
Question Prompt:
{question.question_text}

Maximum Total Marks: {max_marks_float}

Reference / Model Answer:
{question.reference_answer}

Marking Rubric / Criteria:
{rubric_text}

Common Subject Reference:
{reference_context}

Student's Answer Text:
{submission.answer_text}

EVALUATION INSTRUCTIONS:
1. Focus on semantic understanding rather than strict verbatim keyword matching.
2. Award marks fairly based on demonstrated conceptual understanding according to the rubric.
3. Identify correct concepts present in the answer.
4. Identify critical missing concepts that should have been included.
5. Identify any factual errors, misconceptions, or incorrect statements.
6. Provide criterion-wise marks breakdown with specific reasons.
7. Provide clear explainable reasoning justifying the total marks awarded.
8. Provide constructive, positive, pedagogical feedback to help the student improve.
9. Estimate your evaluation confidence (a decimal value between 0.0 and 1.0).
10. Ensure suggested_marks is between 0.0 and {max_marks_float}.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT conforming to this exact structure:
{{
    "suggested_marks": <number between 0 and {max_marks_float}>,
    "max_marks": {max_marks_float},
    "concepts_found": ["<correct concept 1>", "<correct concept 2>"],
    "missing_concepts": ["<missing concept 1>", "<missing concept 2>"],
    "incorrect_concepts": ["<incorrect concept/misconception if any>"],
    "criterion_wise_marks": [
        {{
            "criterion": "<Criterion Title>",
            "marks_awarded": <number>,
            "max_marks": <number>,
            "reason": "<Specific reason for marks awarded>"
        }}
    ],
    "reasoning": "<Detailed explainable justification of the mark calculation>",
    "feedback": "<Pedagogical feedback for student>",
    "confidence": <decimal between 0.0 and 1.0>
}}
"""

    # 4. Call Gemini AI Client
    try:
        client = genai.Client(api_key=api_key)
        contents = [prompt]
        if reference_document:
            contents.extend(["Common subject reference document:", reference_document])
        if question_document:
            contents.extend(["Exam question paper:", question_document])
        if answer_document:
            contents.extend(["Student answer sheet:", answer_document])
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        raw_text = response.text
    except APIError as e:
        logger.error("Gemini API call failed: %s", e)
        raise EvaluationServiceError(f"Gemini API error during evaluation: {e}")
    except Exception as e:
        logger.exception("Unexpected error while invoking Gemini API: %s", e)
        raise EvaluationServiceError(
            f"An unexpected error occurred while communicating with Gemini AI: {e}"
        )

    # 5. Parse and validate JSON structure
    data = parse_ai_json_response(raw_text)

    # Validate suggested_marks
    raw_suggested = data.get("suggested_marks")
    if raw_suggested is None:
        raise EvaluationServiceError(
            "AI response is missing the required 'suggested_marks' field."
        )

    try:
        suggested_marks_val = round(Decimal(str(raw_suggested)), 2)
    except Exception:
        raise EvaluationServiceError(
            f"Invalid 'suggested_marks' value in AI response: {raw_suggested}"
        )

    # Clamp marks safely between 0.0 and max_marks
    max_marks_dec = Decimal(str(max_marks_float))
    if suggested_marks_val < Decimal("0.0"):
        suggested_marks_val = Decimal("0.0")
    elif suggested_marks_val > max_marks_dec:
        suggested_marks_val = max_marks_dec

    # Validate confidence
    raw_confidence = data.get("confidence", 0.85)
    try:
        confidence_val = float(raw_confidence)
        if confidence_val > 1.0 and confidence_val <= 100.0:
            confidence_val = confidence_val / 100.0
        confidence_val = max(0.0, min(1.0, round(confidence_val, 2)))
    except Exception:
        confidence_val = 0.85

    feedback_val = str(data.get("feedback", "")).strip() or (
        "Evaluation completed. Review your concept breakdown and teacher remarks."
    )
    reasoning_val = str(data.get("reasoning", "")).strip() or (
        "Automated semantic evaluation based on provided rubric."
    )

    concepts_found_val = (
        data.get("concepts_found")
        if isinstance(data.get("concepts_found"), list)
        else []
    )
    missing_concepts_val = (
        data.get("missing_concepts")
        if isinstance(data.get("missing_concepts"), list)
        else []
    )
    incorrect_concepts_val = (
        data.get("incorrect_concepts")
        if isinstance(data.get("incorrect_concepts"), list)
        else []
    )
    criterion_wise_val = (
        data.get("criterion_wise_marks")
        if isinstance(data.get("criterion_wise_marks"), list)
        else []
    )

    # 6. Save Evaluation record
    evaluation = Evaluation.objects.create(
        submission=submission,
        suggested_marks=suggested_marks_val,
        max_marks=max_marks_dec,
        feedback=feedback_val,
        concepts_found=concepts_found_val,
        missing_concepts=missing_concepts_val,
        incorrect_concepts=incorrect_concepts_val,
        criterion_wise_marks=criterion_wise_val,
        reasoning=reasoning_val,
        confidence=confidence_val,
        teacher_review_status=Evaluation.ReviewStatus.PENDING,
        teacher_approved_marks=None,
    )

    # 7. Update submission status to EVALUATED
    submission.status = submission.Status.EVALUATED
    submission.save(update_fields=["status"])

    return evaluation
