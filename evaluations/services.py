import json
import logging
import os
import re
import math
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from .models import Evaluation, QuestionEvaluation
from questions.models import Question, SubjectResource
from questions.rag_models import QuestionPaper
from submissions.models import Submission
from submissions.state import transition_submission, InvalidStatusTransition
from rag.services import extract_document, retrieve_reference_chunks
from rag.groq_client import GroqError, chat
from .reporting import generate_evaluation_report

logger = logging.getLogger(__name__)


def _normalize_question_number(value):
    """Match common model renderings such as ``1.``, ``Q1`` and ``Question 1``."""
    normalized = re.sub(r"[^a-z0-9]+", "", str(value).lower())
    return re.sub(r"^(?:question|q)", "", normalized)


def _question_result_map(data):
    rows = data.get("question_evaluations") if isinstance(data, dict) else None
    if not isinstance(rows, list):
        return {}
    result = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        number = _normalize_question_number(row.get("question_number", ""))
        if number and number not in result:
            result[number] = row
    return result


def _question_rows_error(data, extracted_questions):
    rows = data.get("question_evaluations") if isinstance(data, dict) else None
    if not isinstance(rows, list) or not rows:
        return "AI response is missing question-level results."
    if not extracted_questions:
        return None

    expected = [_normalize_question_number(item.number) for item in extracted_questions]
    returned = [
        _normalize_question_number(item.get("question_number", ""))
        for item in rows
        if isinstance(item, dict)
    ]
    if len(rows) != len(expected) or len(returned) != len(expected) or set(returned) != set(expected):
        missing = sorted(set(expected) - set(returned))
        return (
            "AI response must return exactly one result per question; missing: "
            f"{', '.join(missing) or 'duplicate or extra question rows'}."
        )
    return None


class EvaluationServiceError(Exception):
    """Custom exception raised when AI evaluation encounters an error."""

    pass


def validate_approved_rubric(question):
    """Enforce the EADAES grading contract before an exam is graded."""
    exam = getattr(question, "exam", None)
    if exam is None:
        return None  # legacy question records remain compatible
    rubric = getattr(question, "rubric", None)
    if rubric is None or rubric.status != "approved":
        raise EvaluationServiceError(
            f"Rubric approval is required before grading question {question.id}."
        )
    points = list(rubric.points.all())
    if not points:
        raise EvaluationServiceError(f"Approved rubric for question {question.id} has no points.")
    total = sum((point.marks for point in points), Decimal("0.00"))
    if total != question.max_marks:
        raise EvaluationServiceError(
            f"Rubric points total {total} but question maximum is {question.max_marks}."
        )
    if exam.status != exam.Status.READY:
        raise EvaluationServiceError(f"Exam '{exam.name}' is not ready for grading.")
    return rubric


def validate_exam_for_grading(subject, question_paper):
    """Validate the complete EADAES exam contract before a sheet is graded."""
    from questions.models import Exam

    exam = subject.exams.filter(status=Exam.Status.READY).order_by("-updated_at").first()
    if exam is None:
        raise EvaluationServiceError("The subject exam must be READY before answer sheets can be graded.")
    extracted_questions = list(question_paper.questions.all())
    if not extracted_questions:
        raise EvaluationServiceError("The question paper has no extracted questions to grade.")
    for extracted in extracted_questions:
        question = Question.objects.filter(
            teacher=subject.teacher,
            exam=exam,
            subject=subject.name,
            title=f"{subject.name} {extracted.number}",
        ).first()
        if question is None:
            raise EvaluationServiceError(f"Question {extracted.number} is not assigned to the READY exam.")
        validate_approved_rubric(question)
    return exam


def _bounded_decimal(value, default=Decimal("0"), maximum=None):
    try:
        result = Decimal(str(value))
        if not result.is_finite():
            raise ValueError
    except (ValueError, TypeError, ArithmeticError):
        result = default
    result = max(Decimal("0"), result)
    if maximum is not None:
        result = min(result, maximum)
    return result.quantize(Decimal("0.01"))


def _bounded_confidence(value):
    try:
        result = float(value)
        if result > 1.0 and result <= 100.0:
            result /= 100.0
        if not math.isfinite(result):
            raise ValueError
    except (ValueError, TypeError):
        result = 0.0
    return max(0.0, min(1.0, round(result, 2)))


def _as_bool(value):
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    return bool(value)


def normalize_for_quote_match(text: str) -> str:
    """Normalize text by lowercasing, stripping punctuation, and collapsing whitespace."""
    if not text:
        return ""
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return " ".join(text.split())


def verify_student_quote(quote: str, student_answer: str, full_answer_text: str = "") -> bool:
    """Check if quote actually appears in student_answer or full_answer_text (normalized/fuzzy)."""
    norm_quote = normalize_for_quote_match(quote)
    if not norm_quote:
        return True
    norm_student = normalize_for_quote_match(student_answer)
    if norm_quote in norm_student:
        return True
    if full_answer_text:
        norm_full = normalize_for_quote_match(full_answer_text)
        if norm_quote in norm_full:
            return True
    from difflib import SequenceMatcher

    return max(
        SequenceMatcher(None, norm_quote, norm_student).ratio(),
        SequenceMatcher(None, norm_quote, norm_full).ratio() if full_answer_text else 0,
    ) >= 0.92


def parse_ai_json_response(raw_text: str) -> dict:
    """
    Extracts and parses JSON object from AI model response text,
    stripping markdown fences if present.
    """
    if not raw_text or not raw_text.strip():
        raise EvaluationServiceError("Empty response received from Groq.")

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
        # Provider output may contain transcribed student work; never log it.
        logger.error("Failed to parse structured JSON from AI response.")
        raise EvaluationServiceError(
            f"Failed to parse structured JSON from AI response: {e}"
        )


def evaluate_submission(submission) -> Evaluation:
    """
    Evaluates a student's answer using Groq.
    Performs semantic analysis against the reference answer and marking rubric.
    Generates explainable scoring breakdown, identified concepts, feedback, and confidence.
    """
    # 1. Prevent duplicate evaluations
    if hasattr(submission, "evaluation") and submission.evaluation is not None:
        raise EvaluationServiceError(
            "This submission has already been evaluated. Duplicate evaluations are prevented."
        )

    # 2. Check the explicitly selected provider mode.
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    mock_mode = bool(getattr(settings, "EVAL_LLM_MOCK", False))
    if not api_key and not mock_mode:
        raise EvaluationServiceError(
            "GROQ_API_KEY is not configured in the backend environment. Please set GROQ_API_KEY."
        )

    if submission.status in {
        Submission.Status.UPLOADED,
        Submission.Status.SUBMITTED,
        Submission.Status.FAILED,
    }:
        try:
            transition_submission(submission, Submission.Status.PROCESSING)
        except InvalidStatusTransition as exc:
            raise EvaluationServiceError(str(exc)) from exc

    # 3. Prepare evaluation context
    question = submission.question
    rubric = getattr(question, "rubric", None)
    if rubric and rubric.status == "approved":
        rubric_text = question.marking_rubric.strip() or "Evaluate fairly based on approved rubric."
    else:
        rubric_text = (
            question.marking_rubric.strip()
            if question.marking_rubric
            else "Evaluate fairly based on clarity, correctness, completeness, and conceptual accuracy against reference material."
        )
    max_marks_float = float(question.max_marks)

    source_sheet = getattr(submission, "source_answer_sheet", None)
    subject_resource = (
        submission.subject
        if getattr(submission, "subject", None)
        else (
            source_sheet.subject
            if source_sheet and source_sheet.subject_id
            else SubjectResource.objects.filter(
                teacher=question.teacher, name=question.subject
            ).first()
        )
    )
    question_paper = submission.question_paper
    if not question_paper and subject_resource:
        question_paper = QuestionPaper.objects.filter(
            subject=subject_resource,
            processing_status="COMPLETED",
        ).order_by("-uploaded_at").first()
    extracted_questions = list(question_paper.questions.all()) if question_paper else []
    extracted_total = sum(
        (item.maximum_marks for item in extracted_questions if item.maximum_marks is not None),
        Decimal("0.00"),
    )
    if source_sheet and extracted_questions and all(item.maximum_marks is not None for item in extracted_questions) and extracted_total > 0:
        max_marks_float = float(extracted_total)
    question_outline = "\n".join(
        f"{item.number}: {item.text} (maximum marks: {item.maximum_marks or 'not specified'})"
        for item in extracted_questions
    ) or "Question-wise extraction was unavailable; evaluate the submitted examination as a whole."
    extracted_answers = {
        item.question_id: item
        for item in submission.extracted_answers.select_related("question").all()
    }

    def document_context(document):
        if not document or not document.name:
            return {"text": "", "path": None}
        try:
            text, _ = extract_document(document)
            return {"text": text[:30000], "path": document.path}
        except Exception as exc:
            logger.warning("Could not read evaluation document %s: %s", document.name, exc)
            return {"text": "", "path": None}

    reference_version = getattr(submission, "reference_document", None)
    if reference_version is None and subject_resource:
        reference_version = subject_resource.reference_documents.filter(
            processing_status="COMPLETED"
        ).order_by("-version", "-uploaded_at").first()
    reference_document = (
        document_context(reference_version.document)
        if reference_version
        else (document_context(subject_resource.reference_notes) if subject_resource else {"text": "", "path": None})
    )
    evaluation_scheme = document_context(subject_resource.evaluation_scheme) if subject_resource else {"text": "", "path": None}
    question_document = document_context(question_paper.document) if question_paper else {"text": "", "path": None}
    answer_document = document_context(submission.answer_document)
    reference_context = (
        subject_resource.notes_description.strip()
        if subject_resource and subject_resource.notes_description
        else "Use the attached common subject reference document."
    )
    retrieved_chunks = retrieve_reference_chunks(
        subject_resource,
        question.question_text,
        reference_document=reference_version,
    ) if subject_resource else []
    retrieved_context = "\n\n".join(
        f"[Reference chunk {chunk.id}, page {chunk.page_number or 'unknown'}] {chunk.text}" for chunk in retrieved_chunks
    ) or "No indexed reference chunks were available; use only the attached reference document."
    question_context = []
    for extracted_question in extracted_questions:
        answer_record = extracted_answers.get(extracted_question.id)
        answer_text = (
            answer_record.answer_text
            if answer_record
            else (submission.answer_text if len(extracted_questions) == 1 else "")
        )
        question_chunks = retrieve_reference_chunks(
            subject_resource,
            extracted_question.text,
            limit=3,
            reference_document=reference_version,
        ) if subject_resource else []
        evidence = "\n".join(
            f"[Reference chunk {chunk.id}, page {chunk.page_number or 'unknown'}] {chunk.text}"
            for chunk in question_chunks
        ) or "No question-specific reference chunk was retrieved."
        question_context.append(
            f"Question {extracted_question.number}: {extracted_question.text}\n"
            f"Maximum marks: {extracted_question.maximum_marks or 'not specified'}\n"
            f"Student answer: {answer_text or 'No answer text was extracted.'}\n"
            f"Retrieved reference evidence:\n{evidence}"
        )
    question_context_text = "\n\n---\n\n".join(question_context) or (
        "Question-wise answer extraction was unavailable; evaluate the complete answer document."
    )
    evaluation_token_budget = min(
        12000,
        max(int(settings.GROQ_EVALUATION_MAX_TOKENS), 450 * max(len(extracted_questions), 1)),
    )

    prompt = f"""You are EvalAI, an expert, objective, pedagogical evaluator and academic grader.
Evaluate the student's descriptive answer by performing semantic analysis against the question, reference answer, and marking rubric.

Question Title: {question.title}
Subject: {question.subject}
Question Prompt:
{question.question_text}

Extracted Question Paper Questions:
{question_outline}

Maximum Total Marks: {max_marks_float}

Reference / Model Answer:
{question.reference_answer}

Marking Rubric / Criteria:
{rubric_text}

Common Subject Reference:
{reference_context}

Evaluation Scheme Document:
{evaluation_scheme['text'] or 'No separate evaluation scheme document was supplied.'}

Reference Document Text:
{reference_document['text'] or 'Reference document text could not be extracted.'}

Question Paper Text:
{question_document['text'] or 'Question paper text could not be extracted.'}

Retrieved Reference Evidence:
{retrieved_context}

Question-wise Answer and Retrieved Evidence:
{question_context_text}

Student's Answer Text:
{submission.answer_text}

EVALUATION INSTRUCTIONS:
1. Judge correctness, concept coverage, explanation quality, and the marking criteria. Keywords alone never earn marks.
2. Award marks only for demonstrated understanding supported by the student's answer.
3. Identify correct concepts present in the answer.
4. Identify critical missing concepts that should have been included.
5. Identify any factual errors, misconceptions, or incorrect statements.
6. Provide criterion-wise marks breakdown with specific reasons.
7. Provide clear explainable reasoning justifying the total marks awarded.
8. Provide constructive, positive, pedagogical feedback to help the student improve.
9. Estimate your evaluation confidence (a decimal value between 0.0 and 1.0).
10. Ensure suggested_marks is between 0.0 and {max_marks_float}.
11. Return exactly one row for every extracted question, including a zero-mark not-attempted row when its answer is blank.
12. Copy student evidence quotes verbatim from that question's transcription. Never invent or paraphrase a quote.
13. Cite only the supplied reference chunk ids and page numbers in reference_evidence.
14. Keep expected_answer grounded in the supplied subject reference material.
15. Keep each result concise: expected_answer <= 45 words; correct_points, mistakes, missing_concepts, and improvement_suggestions have at most 2 short items each; justification <= 30 words; evidence has at most 1 exact quote; reference_evidence has at most 1 citation.
16. Put question_evaluations first in the JSON object and include every extracted question, even when its answer is blank.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT conforming to this exact structure:
{{
    "question_evaluations": [
        {{
            "question_number": "<exact identifier from the extracted question list>",
            "maximum_marks": <number>,
            "awarded_marks": <number>,
            "expected_answer": "<expected answer grounded in the supplied reference>",
            "correct_points": ["<correct point demonstrated>"],
            "mistakes": ["<specific incorrect statement, if any>"],
            "missing_concepts": ["<required concept not demonstrated>"],
            "justification": "<question-level marking rationale>",
            "improvement_suggestions": ["<specific next step>"],
            "evidence": ["<verbatim student quote supporting the marks>"],
            "reference_evidence": [{{"chunk_id": <supplied id>, "page_number": <page>, "text": "<supporting reference text>"}}],
            "flags": [],
            "confidence": <decimal between 0.0 and 1.0>,
            "requires_teacher_review": <true or false>
        }}
    ],
    "suggested_marks": <number between 0 and {max_marks_float}>,
    "max_marks": {max_marks_float},
    "concepts_found": ["<correct concept>"] ,
    "missing_concepts": ["<missing concept>"],
    "incorrect_concepts": ["<incorrect concept or misconception>"],
    "criterion_wise_marks": [{{"criterion": "<criterion>", "marks_awarded": <number>, "max_marks": <number>, "reason": "<reason>"}}],
    "reasoning": "<Concise explanation of the overall mark calculation>",
    "feedback": "<Constructive student feedback>",
    "confidence": <decimal between 0.0 and 1.0>
}}
"""

    # 4. Either call the explicitly configured Groq provider or use the
    # deterministic local demo scorer. Mock results are always low-confidence.
    if mock_mode:
        mock_rows = []
        mock_total = Decimal("0.00")
        for extracted_question in extracted_questions:
            answer_record = extracted_answers.get(extracted_question.id)
            answer = (answer_record.answer_text if answer_record else "").strip()
            maximum = _bounded_decimal(extracted_question.maximum_marks or 0)
            chunks = retrieve_reference_chunks(
                subject_resource,
                extracted_question.text,
                limit=3,
                reference_document=reference_version,
            ) if subject_resource else []
            reference_text = " ".join(chunk.text for chunk in chunks) or question.reference_answer
            answer_terms = set(re.findall(r"[a-z0-9]{3,}", answer.lower()))
            reference_terms = set(re.findall(r"[a-z0-9]{3,}", reference_text.lower()))
            overlap = answer_terms & reference_terms
            ratio = Decimal(len(overlap)) / Decimal(max(len(reference_terms), 1))
            awarded = _bounded_decimal(
                maximum * min(ratio * Decimal("2"), Decimal("0.8")),
                maximum=maximum,
            ) if answer else Decimal("0.00")
            mock_total += awarded
            sentence = re.split(r"(?<=[.!?])\s+", answer, maxsplit=1)[0].strip()
            flags = ["mock_ai", "low_confidence"]
            if not answer:
                flags.append("not_attempted")
            mock_rows.append({
                "question_number": extracted_question.number,
                "maximum_marks": str(maximum),
                "awarded_marks": str(awarded),
                "student_answer": answer,
                "expected_answer": reference_text[:3000],
                "correct_points": [f"Mock lexical overlap detected {len(overlap)} shared terms; teacher verification required."] if answer and overlap else [],
                "mistakes": [],
                "missing_concepts": [],
                "justification": "Deterministic mock result for workflow verification; it is not a real AI judgment.",
                "improvement_suggestions": ["Review the reference and explain the underlying concepts in your own words."],
                "criteria": [],
                "correct_concepts": [],
                "feedback": "MOCK AI result. A teacher must verify this low-confidence score.",
                "evidence": [sentence] if sentence else [],
                "reference_evidence": [
                    {"chunk_id": chunk.id, "page_number": chunk.page_number, "text": chunk.text[:1200]}
                    for chunk in chunks
                ],
                "confidence": 0.3,
                "flags": flags,
                "requires_teacher_review": True,
            })
        data = {
            "suggested_marks": str(mock_total),
            "max_marks": str(max_marks_float),
            "confidence": 0.3,
            "feedback": "MOCK AI result. Review the evidence and score before publication.",
            "reasoning": "Deterministic local workflow mock. It does not represent a provider evaluation.",
            "question_evaluations": mock_rows,
        }
        raw_text = json.dumps(data)
    else:
        try:
            file_parts = [
                item for item in [reference_document, evaluation_scheme, question_document, answer_document]
                if item.get("path")
            ]
            raw_text = chat(
                prompt,
                file_parts=file_parts,
                json_mode=True,
                max_tokens=evaluation_token_budget,
            )
        except GroqError as e:
            logger.error("Groq API call failed: %s", e)
            raise EvaluationServiceError(f"Groq API error during evaluation: {e}")
        except Exception as e:
            logger.exception("Unexpected error while invoking Groq AI: %s", e)
            raise EvaluationServiceError(
                f"An unexpected error occurred while communicating with Groq AI: {e}"
            )

    # 5. Parse and validate JSON structure with one targeted repair attempt.
    data = {}
    try:
        data = parse_ai_json_response(raw_text)
        rows_error = _question_rows_error(data, extracted_questions)
        if rows_error:
            raise EvaluationServiceError(rows_error)
    except EvaluationServiceError:
        try:
            original_data = data if isinstance(data, dict) else {}
            initial_rows = original_data.get("question_evaluations")
            initial_map = _question_result_map(original_data)
            expected_numbers = {_normalize_question_number(item.number) for item in extracted_questions}
            invalid_initial_rows = (
                not isinstance(initial_rows, list)
                or len(initial_map) != len(initial_rows)
                or any(number not in expected_numbers for number in initial_map)
            )
            if invalid_initial_rows:
                initial_map = {}

            missing_questions = [
                item for item in extracted_questions
                if _normalize_question_number(item.number) not in initial_map
            ]
            if not missing_questions and extracted_questions:
                # If there are duplicates or extra rows, regenerate the set.
                initial_map = {}
                missing_questions = list(extracted_questions)

            required_rows = [
                {
                    "question_number": item.number,
                    "maximum_marks": str(item.maximum_marks) if item.maximum_marks is not None else None,
                    "question_text": item.text,
                }
                for item in missing_questions
            ]
            preserved_rows = [
                initial_map[_normalize_question_number(item.number)]
                for item in extracted_questions
                if _normalize_question_number(item.number) in initial_map
            ]
            repair_prompt = f"""Repair the grading result below. The prior result was invalid JSON or omitted required question rows.

Return exactly one question_evaluations row for every question in this missing list, preserving each question_number exactly. Do not repeat the already validated rows:
{json.dumps(required_rows, ensure_ascii=False)}

Already validated rows to preserve unchanged:
{json.dumps(preserved_rows, ensure_ascii=False)}

Original grading prompt and evidence:
{prompt[:50000]}

Previous model response:
{raw_text[:6000]}

Return ONLY a JSON object with a question_evaluations array. Keep all text concise and do not add explanation outside the JSON."""
            repair_prompt += "\nFor each missing row only, keep expected_answer <= 35 words, each list <= 2 items, justification <= 25 words, and include at most one short exact student quote and one valid reference citation."
            repair_token_budget = min(
                8000,
                max(
                    int(settings.GROQ_EVALUATION_REPAIR_MAX_TOKENS),
                    350 * max(len(missing_questions or extracted_questions), 1),
                ),
            )
            raw_text = chat(
                repair_prompt,
                json_mode=True,
                max_tokens=repair_token_budget,
            )
            repaired_data = parse_ai_json_response(raw_text)
            rows_error = _question_rows_error(repaired_data, missing_questions or extracted_questions)
            if rows_error:
                raise EvaluationServiceError(f"Repaired response: {rows_error}")

            repaired_map = _question_result_map(repaired_data)
            merged_rows = []
            for item in extracted_questions:
                number = _normalize_question_number(item.number)
                row = initial_map.get(number) or repaired_map.get(number)
                if row is not None:
                    merged_rows.append(row)
            data = {**original_data, **repaired_data}
            if extracted_questions:
                data["question_evaluations"] = merged_rows
        except Exception as retry_exc:
            logger.error("Failed to parse JSON even after repair attempt: %s", retry_exc)
            raise EvaluationServiceError(f"Failed to parse structured JSON from AI response: {retry_exc}")

    # Validate suggested_marks
    raw_suggested = data.get("suggested_marks")
    if raw_suggested is None and not data.get("question_evaluations"):
        raise EvaluationServiceError(
            "AI response is missing the required 'suggested_marks' field."
        )

    try:
        suggested_marks_val = (
            _bounded_decimal(
                raw_suggested,
                maximum=Decimal(str(max_marks_float)),
            )
            if raw_suggested is not None
            else Decimal("0.00")
        )
    except Exception:
        raise EvaluationServiceError(
            f"Invalid 'suggested_marks' value in AI response: {raw_suggested}"
        )

    # Clamp marks safely between 0.0 and max_marks
    max_marks_dec = Decimal(str(max_marks_float)).quantize(Decimal("0.01"))

    # Validate confidence
    raw_confidence = data.get("confidence", 0.85)
    try:
        confidence_val = _bounded_confidence(raw_confidence)
    except Exception:
        confidence_val = 0.0

    feedback_val = str(data.get("feedback") or data.get("overall_feedback") or "").strip() or (
        "Evaluation completed. Review your concept breakdown and teacher remarks."
    )
    reasoning_val = str(data.get("reasoning") or data.get("overall_reasoning") or "").strip() or (
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
    question_evaluations_val = data.get("question_evaluations") if isinstance(data.get("question_evaluations"), list) else []
    if extracted_questions and len(question_evaluations_val) != len(extracted_questions):
        raise EvaluationServiceError("Question-level results are incomplete; no evaluation was saved.")

    # Retrieve valid reference chunk IDs for subject
    valid_chunk_ids = set()
    if subject_resource:
        from questions.rag_models import ReferenceChunk
        chunk_query = ReferenceChunk.objects.filter(document__subject=subject_resource)
        if reference_version is not None:
            chunk_query = chunk_query.filter(document=reference_version)
        valid_chunk_ids = set(chunk_query.values_list("id", flat=True))

    confidence_threshold = float(getattr(settings, "LLM_CONFIDENCE_THRESHOLD", 0.65))

    # 6. Save Evaluation and its normalized question-level records atomically.
    with transaction.atomic():
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
            status=Evaluation.Status.AI_EVALUATED,
            teacher_approved_marks=None,
            model_name="mock-deterministic" if mock_mode else (os.getenv("GROQ_MODEL", "") if os.getenv("LLM_PROVIDER", "groq").lower() == "groq" else os.getenv("ANTHROPIC_MODEL", "")),
            prompt_version=getattr(settings, "LLM_PROMPT_VERSION", "eadaes-v1"),
        )
        extracted_by_number = {_normalize_question_number(item.number): item for item in extracted_questions}
        created_q_evals = []
        total_awarded_sum = Decimal("0.00")
        has_extracted_match = False

        for item in question_evaluations_val:
            if not isinstance(item, dict):
                continue
            extracted_question = extracted_by_number.get(_normalize_question_number(item.get("question_number", "")))
            if not extracted_question:
                continue
            has_extracted_match = True
            extracted_maximum = extracted_question.maximum_marks
            maximum = (
                _bounded_decimal(extracted_maximum)
                if extracted_maximum is not None
                else _bounded_decimal(item.get("maximum_marks") or 0)
            )
            raw_awarded = item.get("awarded_marks") if item.get("awarded_marks") is not None else item.get("marks_awarded")
            awarded = _bounded_decimal(raw_awarded or 0, maximum=maximum)
            total_awarded_sum += awarded

            q_ans_record = extracted_answers.get(extracted_question.id)
            student_answer_str = str(q_ans_record.answer_text if q_ans_record else (submission.answer_text if len(extracted_questions) == 1 else ""))

            # Quote verification against transcribed student answer
            raw_evidence = item.get("evidence") if isinstance(item.get("evidence"), list) else []
            verified_evidence = []
            flags = item.get("flags") if isinstance(item.get("flags"), list) else []
            flags = [str(flag) for flag in flags]
            q_conf = _bounded_confidence(item.get("confidence", confidence_val))
            failed_pages = (submission.extraction_metadata or {}).get("failed_vision_pages", [])
            if failed_pages:
                for flag in ("illegible", "possible_extraction_error"):
                    if flag not in flags:
                        flags.append(flag)
                q_conf = min(q_conf, 0.4)

            for quote in raw_evidence:
                quote_str = str(quote).strip()
                if not quote_str:
                    continue
                if verify_student_quote(quote_str, student_answer_str, submission.answer_text):
                    verified_evidence.append(quote_str)
                else:
                    if "hallucinated_quote" not in flags:
                        flags.append("hallucinated_quote")
                    q_conf = max(0.0, round(q_conf - 0.25, 2))

            student_quote_str = str(item.get("student_quote", "")).strip()[:10000]
            if student_quote_str and not verify_student_quote(student_quote_str, student_answer_str, submission.answer_text):
                if "hallucinated_quote" not in flags:
                    flags.append("hallucinated_quote")
                q_conf = max(0.0, round(q_conf - 0.25, 2))
                student_quote_str = ""

            # Reference evidence verification
            raw_ref_evidence = item.get("reference_evidence") if isinstance(item.get("reference_evidence"), list) else []
            verified_ref_evidence = []
            for r_item in raw_ref_evidence:
                if isinstance(r_item, dict) and "chunk_id" in r_item:
                    try:
                        cid = int(r_item["chunk_id"])
                        if cid in valid_chunk_ids:
                            citation = dict(r_item)
                            citation["chunk_id"] = cid
                            verified_ref_evidence.append(citation)
                    except (ValueError, TypeError):
                        pass

            if q_conf < confidence_threshold and "low_confidence" not in flags:
                flags.append("low_confidence")

            req_review = _as_bool(item.get("requires_teacher_review", False)) or bool(flags)

            q_eval = QuestionEvaluation.objects.create(
                evaluation=evaluation,
                question=extracted_question,
                ai_marks=awarded,
                awarded_marks=awarded,
                maximum_marks=maximum,
                student_answer=student_answer_str,
                expected_answer=str(item.get("expected_answer") or " ".join(
                    chunk.text for chunk in retrieve_reference_chunks(
                        subject_resource,
                        extracted_question.text,
                        limit=3,
                        reference_document=reference_version,
                    )
                ))[:10000],
                correct_points=item.get("correct_points") if isinstance(item.get("correct_points"), list) else (item.get("correct_concepts") or []),
                mistakes=item.get("mistakes") if isinstance(item.get("mistakes"), list) else [],
                missing_concepts=item.get("missing_concepts") if isinstance(item.get("missing_concepts"), list) else [],
                evidence=verified_evidence,
                reference_evidence=verified_ref_evidence,
                justification=str(item.get("justification") or item.get("reason") or ""),
                improvement_suggestions=item.get("improvement_suggestions") if isinstance(item.get("improvement_suggestions"), list) else [],
                flags=flags,
                criteria=item.get("criteria") if isinstance(item.get("criteria"), list) else [],
                correct_concepts=item.get("correct_concepts") if isinstance(item.get("correct_concepts"), list) else [],
                feedback=str(item.get("feedback", "")),
                student_quote=student_quote_str,
                source_pages=item.get("source_pages") if isinstance(item.get("source_pages"), list) else [],
                bbox_json=item.get("bbox") if isinstance(item.get("bbox"), list) else [],
                confidence=q_conf,
                requires_teacher_review=req_review,
            )
            created_q_evals.append(q_eval)

        # Server-side total calculation: sum question marks when extracted questions were evaluated
        if has_extracted_match:
            evaluation.suggested_marks = total_awarded_sum
            evaluation.save(update_fields=["suggested_marks"])

        # Check if needs attention
        if any(qe.requires_teacher_review for qe in created_q_evals):
            evaluation.needs_attention = True
            evaluation.save(update_fields=["needs_attention"])

        # Keep the Submission and Evaluation state in lockstep through the one
        # allowed transition service. Report generation happens only afterward.
        transition_submission(submission, Submission.Status.AI_EVALUATED, evaluation=evaluation)
        transition_submission(submission, Submission.Status.PENDING_TEACHER_REVIEW, evaluation=evaluation)

    # 7. Clear any prior failure message after successful evaluation.
    submission.processing_error = ""
    submission.save(update_fields=["processing_error"])
    evaluation = generate_evaluation_report(evaluation)

    return evaluation
