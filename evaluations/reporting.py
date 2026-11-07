from io import BytesIO
from xml.sax.saxutils import escape

from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _text(value):
    if isinstance(value, (list, tuple)):
        return "; ".join(str(item) for item in value)
    return str(value or "—")


def _paragraph(value, style):
    return Paragraph(escape(_text(value)).replace("\n", "<br/>"), style)


def generate_evaluation_report(evaluation):
    """Generate one PDF report, replacing the same report after teacher review."""
    evaluation = (
        evaluation.__class__.objects.select_related(
            "submission__student", "submission__question"
        ).prefetch_related("question_evaluations__question").get(pk=evaluation.pk)
    )
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Title"], alignment=TA_CENTER, fontSize=18, leading=22
    )
    heading_style = ParagraphStyle(
        "ReportHeading", parent=styles["Heading2"], fontSize=12, leading=15, spaceBefore=8
    )
    body_style = ParagraphStyle("ReportBody", parent=styles["BodyText"], fontSize=9, leading=12)
    small_style = ParagraphStyle("ReportSmall", parent=body_style, fontSize=8, leading=10)
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
    )
    submission = evaluation.submission
    question_evaluations = list(evaluation.question_evaluations.all())
    story = [
        Paragraph("EvalAI Evaluation Report", title_style),
        Spacer(1, 5 * mm),
        Table(
            [
                ["Student", _text(submission.student.get_full_name() or submission.student.username)],
                ["Subject", _text(submission.question.subject)],
                ["Assessment", _text(submission.question.title)],
                ["Status", _text(evaluation.get_teacher_review_status_display())],
                ["AI marks", f"{evaluation.suggested_marks} / {evaluation.max_marks}"],
                ["Final marks", f"{evaluation.final_marks} / {evaluation.max_marks}"],
                ["AI model / prompt", f"{evaluation.model_name or 'legacy'} / {evaluation.prompt_version or 'legacy'}"],
                ["Overall confidence", f"{evaluation.confidence:.0%}"],
            ],
            colWidths=[34 * mm, 140 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef4ff")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]),
        ),
        Paragraph("Overall feedback", heading_style),
        _paragraph(evaluation.feedback, body_style),
        Paragraph("Mistakes and missing concepts", heading_style),
        _paragraph(evaluation.incorrect_concepts + evaluation.missing_concepts, body_style),
        Paragraph("Evaluation criteria", heading_style),
    ]
    criteria = evaluation.criterion_wise_marks or []
    if criteria:
        story.append(Table(
            [["Criterion", "Marks", "Reason"]] + [
                [_paragraph(item.get("criterion", "Criterion"), small_style),
                 _paragraph(f"{item.get('marks_awarded', 0)} / {item.get('max_marks', 0)}", small_style),
                 _paragraph(item.get("reason", ""), small_style)]
                for item in criteria if isinstance(item, dict)
            ],
            colWidths=[42 * mm, 25 * mm, 107 * mm],
            repeatRows=1,
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]),
        ))
    else:
        story.append(_paragraph("No criterion-level details were returned.", body_style))

    if question_evaluations:
        story.append(Paragraph("Question-wise evaluation", heading_style))
        for item in question_evaluations:
            story.extend([
                Paragraph(
                    f"Question {_text(item.question.number)} — {item.awarded_marks} / {item.maximum_marks}",
                    styles["Heading3"],
                ),
                _paragraph(item.feedback, body_style),
                _paragraph(
                    f"Correct concepts: {_text(item.correct_concepts)} | Missing concepts: {_text(item.missing_concepts)}",
                    small_style,
                ),
                _paragraph(
                    f"Student quote: {_text(item.student_quote)} | Confidence: {item.confidence:.0%}",
                    small_style,
                ),
                _paragraph(
                    f"Reference pages: {_text(item.source_pages)} | Bounding boxes: {_text(item.bbox_json)}",
                    small_style,
                ),
                _paragraph(f"Reference evidence: {_text(item.evidence)}", small_style),
            ])

    story.extend([
        Paragraph("Teacher comments", heading_style),
        _paragraph(evaluation.teacher_comments, body_style),
        Paragraph("Explainable reasoning", heading_style),
        _paragraph(evaluation.reasoning, body_style),
    ])
    document.build(story)
    filename = f"evaluation-{evaluation.submission_id}.pdf"
    if evaluation.report_document:
        evaluation.report_document.delete(save=False)
    evaluation.report_document.save(filename, ContentFile(buffer.getvalue()), save=False)
    evaluation.save(update_fields=["report_document"])
    return evaluation
