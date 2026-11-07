#!/usr/bin/env python3
"""Exercise the subject evaluation workflow through a running HTTP server.

Run with EVALAI EVAL_LLM_MOCK=true and CELERY_TASK_ALWAYS_EAGER=true, then:
    python scripts/e2e_check.py

Generated test passwords are kept in memory. Set E2E_SCENARIO_FILE to write a
temporary, permission-restricted JSON file for the optional Playwright check.
"""

import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
import uuid

import pymupdf as fitz


BASE_URL = os.getenv("E2E_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
NONCE = uuid.uuid4().hex[:10]
XSS_TEXT = '<img id="e2e-xss-probe" src=x onerror="alert(1)">'


def pdf_bytes(text):
    document = fitz.open()
    page = document.new_page()
    page.insert_textbox(fitz.Rect(60, 60, 540, 760), text, fontsize=12)
    return document.tobytes()


def multipart(fields, files):
    boundary = "----EvalAIE2E" + secrets.token_hex(12)
    chunks = []
    for key, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode(),
            str(value).encode(),
            b"\r\n",
        ])
    for key, (filename, data, content_type) in files.items():
        chunks.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode(),
            f"Content-Type: {content_type}\r\n\r\n".encode(),
            data,
            b"\r\n",
        ])
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def request(method, path, *, token=None, payload=None, fields=None, files=None, expected=(200,)):
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Token {token}"
    if payload is not None:
        body = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    elif fields is not None or files is not None:
        body, headers["Content-Type"] = multipart(fields or {}, files or {})
    else:
        body = None
    req = urllib.request.Request(BASE_URL + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status_code = response.status
            content = response.read()
            response_headers = response.headers
    except urllib.error.HTTPError as exc:
        status_code = exc.code
        content = exc.read()
        response_headers = exc.headers
    if status_code not in expected:
        try:
            body_json = json.loads(content)
            detail = body_json.get("message") or body_json.get("errors") or body_json.get("detail") or ""
        except (ValueError, AttributeError):
            detail = ""
        raise AssertionError(f"{method} {path} returned HTTP {status_code}; expected {expected}. {detail}")
    try:
        result = json.loads(content)
    except (ValueError, TypeError):
        result = None
    return status_code, result, content, response_headers


def api_data(response):
    _, payload, _, _ = response
    if not isinstance(payload, dict) or payload.get("success") is False:
        raise AssertionError("The API returned an unsuccessful response.")
    return payload.get("data", payload)


def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print(f"PASS {message}")


def create_account(role, label):
    username = f"e2e_{label}_{NONCE}"
    email = f"{username}@example.test"
    password = secrets.token_urlsafe(20) + "Z9!"
    route = "teacher" if role == "TEACHER" else "student"
    registration = request(
        "POST",
        f"/api/auth/register/{route}/",
        payload={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": password,
            "first_name": f"E2E {label.title()}",
            "last_name": "User",
        },
        expected=(201,),
    )
    user = api_data(registration)["user"]
    login = api_data(request("POST", "/api/auth/login/", payload={"email": email, "password": password}, expected=(200,)))
    return {"user": user, "email": email, "password": password, "token": login["token"]}


def main():
    health = request("GET", "/api/health/")[2]
    health_data = json.loads(health)
    check(health_data.get("status") == "healthy", "API health endpoint is reachable")
    check(health_data.get("ai_mode") == "mock", "deterministic mock evaluation mode is active")

    teacher = create_account("TEACHER", "teacher")
    student = create_account("STUDENT", "student")
    second_student = create_account("STUDENT", "student2")
    other_teacher = create_account("TEACHER", "other_teacher")
    print("PASS transient teacher and student accounts registered and authenticated")

    subject_name = f"E2E Workflow {NONCE} {XSS_TEXT}"
    question_pdf = pdf_bytes(
        "Question Paper\n1. Explain how a work breakdown structure decomposes project scope into manageable deliverables. (5 marks)"
    )
    reference_pdf = pdf_bytes(
        "Reference Answer\nA work breakdown structure hierarchically decomposes the complete project scope into manageable deliverables and work packages. It supports estimating, scheduling, assigning responsibility, and tracking."
    )
    _, created, _, _ = request(
        "POST",
        "/api/questions/subjects/",
        token=teacher["token"],
        fields={"name": subject_name, "code": f"E2E-{NONCE}", "notes_description": "End-to-end workflow verification"},
        files={
            "question_paper": (f"question-{NONCE}.pdf", question_pdf, "application/pdf"),
            "reference_notes": (f"reference-{NONCE}.pdf", reference_pdf, "application/pdf"),
        },
        expected=(201,),
    )
    subject = api_data((200, created, b"", {}))["resource"]
    subject_id = subject["id"]
    check(bool(subject_id), "teacher created a subject and uploaded the question and reference PDFs once")

    _, pipeline, _, _ = request("GET", f"/api/questions/subjects/{subject_id}/pipeline/", token=teacher["token"])
    pipeline = api_data((200, pipeline, b"", {}))
    check(pipeline.get("is_ready") is True and pipeline.get("extracted_questions_count", 0) >= 1 and pipeline.get("reference_chunks_count", 0) >= 1,
          "question extraction and reference indexing completed")

    for account in (student, second_student):
        request("POST", f"/api/questions/subjects/{subject_id}/enrollments/", token=teacher["token"], payload={"student_id": account["user"]["id"]}, expected=(201,))
    resources = api_data(request("GET", "/api/questions/subjects/", token=student["token"]))["resources"]
    student_subject = next((row for row in resources if row["id"] == subject_id), None)
    check(student_subject is not None and student_subject["question_paper_url"].startswith("/api/") and student_subject["reference_material_url"].startswith("/api/"),
          "enrolled student can see the subject and authenticated document links")
    for suffix in ("question-paper/download/", "reference-material/download/"):
        _, _, file_bytes, _ = request("GET", f"/api/questions/subjects/{subject_id}/{suffix}", token=student["token"])
        check(file_bytes.startswith(b"%PDF-"), f"enrolled student can download {suffix.split('/')[0]}")
    request("GET", f"/api/questions/subjects/{subject_id}/question-paper/download/", token=other_teacher["token"], expected=(404,))
    print("PASS non-enrolled teacher cannot access private subject documents")

    answer_pdf = pdf_bytes(
        "Student Answer\n1. A work breakdown structure decomposes the project scope into smaller deliverables and work packages. These packages make it possible to estimate effort, assign owners, schedule tasks, and track completion."
    )
    def upload_answer(account, label):
        filename = f"e2e-answer-{label}-{NONCE}.pdf"
        response = request(
            "POST",
            f"/api/submissions/subjects/{subject_id}/answer-sheets/",
            token=teacher["token"],
            fields={"subject_id": str(subject_id), "student_id": str(account["user"]["id"])},
            files={"document": (filename, answer_pdf, "application/pdf")},
            expected=(201, 202),
        )
        return filename, api_data(response)["submission"]

    first_filename, first_submission = upload_answer(student, "first")
    first_id = first_submission["id"]
    _, first_detail, _, _ = request("GET", f"/api/submissions/{first_id}/", token=teacher["token"])
    first_detail = api_data((200, first_detail, b"", {}))["submission"]
    check(first_detail["status"] == "PENDING_TEACHER_REVIEW" and first_detail.get("evaluation"),
          "answer sheet was linked to the subject, student, source documents, and AI evaluation")
    evaluation_id = first_detail["evaluation"]["id"]
    _, _, preview_bytes, preview_headers = request(
        "GET", first_detail["answer_sheet_preview_url"], token=teacher["token"]
    )
    check(preview_bytes.startswith(b"\x89PNG\r\n\x1a\n") and preview_headers.get("X-Document-Page-Count") == "1",
          "teacher can view the authenticated raster preview of the original answer sheet")

    student_submission = api_data(request("GET", f"/api/submissions/{first_id}/", token=student["token"]))["submission"]
    student_evaluation = api_data(request("GET", f"/api/evaluations/{evaluation_id}/", token=student["token"]))["evaluation"]
    check(set(student_submission) == {"id", "status", "message"} and student_evaluation.get("message") == "Awaiting teacher review",
          "student receives pending status only before approval")
    request("GET", f"/api/submissions/{first_id}/answer-sheet/download/", token=student["token"], expected=(403,))
    request("GET", first_detail["answer_sheet_preview_url"], token=student["token"], expected=(403,))
    request("GET", f"/api/evaluations/{evaluation_id}/report/download/", token=student["token"], expected=(403,))
    request("GET", f"/api/submissions/{first_id}/", token=second_student["token"], expected=(404,))
    request("GET", f"/media/answer_sheets/inbox/{first_filename}", expected=(404,))
    print("PASS pending results and private uploaded files are withheld from students and anonymous media requests")

    _, evaluation_payload, _, _ = request("GET", f"/api/evaluations/{evaluation_id}/", token=teacher["token"])
    evaluation = api_data((200, evaluation_payload, b"", {}))["evaluation"]
    rows = evaluation.get("question_evaluations", [])
    check(len(rows) == 1 and rows[0].get("student_answer") and rows[0].get("expected_answer"),
          "teacher review includes question-wise student and reference evidence")
    row = rows[0]
    final_mark = max(0.0, float(row.get("ai_marks") or 0) - 0.5)
    request(
        "POST",
        f"/api/evaluations/{evaluation_id}/update-marks/",
        token=teacher["token"],
        payload={
            "question_evaluations": [{"id": row["id"], "awarded_marks": final_mark, "teacher_override_reason": "Checked evidence and adjusted the score.", "feedback": XSS_TEXT}],
            "teacher_comments": XSS_TEXT,
            "feedback": "Teacher reviewed and verified the answer.",
        },
        expected=(200,),
    )
    request("POST", f"/api/evaluations/{evaluation_id}/approve/", token=teacher["token"], payload={"teacher_comments": "Explicit teacher approval."}, expected=(200,))
    prepublish = api_data(request("GET", f"/api/evaluations/{evaluation_id}/", token=student["token"]))["evaluation"]
    check(prepublish.get("message") == "Awaiting teacher review", "approved marks remain hidden until publication")
    request("POST", f"/api/evaluations/{evaluation_id}/publish/", token=teacher["token"], expected=(200,))
    published = api_data(request("GET", f"/api/evaluations/{evaluation_id}/", token=student["token"]))["evaluation"]
    check(published.get("status") == "PUBLISHED" and published.get("teacher_approved_marks") is not None and len(published.get("question_evaluations", [])) == 1,
          "teacher approval published final question-wise marks and feedback")
    for path in (f"/api/submissions/{first_id}/answer-sheet/download/", f"/api/evaluations/{evaluation_id}/report/download/"):
        _, _, content, _ = request("GET", path, token=student["token"])
        check(content.startswith(b"%PDF-"), "student can access own answer sheet and report after publication")
    _, _, published_preview, _ = request("GET", first_detail["answer_sheet_preview_url"], token=student["token"])
    check(published_preview.startswith(b"\x89PNG\r\n\x1a\n"), "student can view the own answer sheet preview after publication")
    request("POST", f"/api/evaluations/{evaluation_id}/publish/", token=teacher["token"], expected=(409,))
    request("GET", f"/api/evaluations/{evaluation_id}/report/download/", token=other_teacher["token"], expected=(403,))
    print("PASS repeat publication is rejected and another teacher cannot download this report")

    second_filename, second_submission = upload_answer(second_student, "browser")
    second_id = second_submission["id"]
    check(second_id != first_id and second_submission["status"] == "PENDING_TEACHER_REVIEW",
          "second student's answer sheet creates an independent pending evaluation")

    scenario_path = os.getenv("E2E_SCENARIO_FILE")
    if scenario_path:
        scenario = {
            "base_url": BASE_URL,
            "teacher": {"email": teacher["email"], "password": teacher["password"]},
            "student": {"email": second_student["email"], "password": second_student["password"]},
            "student_id": second_student["user"]["id"],
            "subject_id": subject_id,
            "subject_name": subject_name,
            "submission_id": second_id,
            "published_submission_id": first_id,
            "xss_probe": "e2e-xss-probe",
        }
        with open(scenario_path, "w", encoding="utf-8") as handle:
            json.dump(scenario, handle)
        os.chmod(scenario_path, 0o600)
        print("PASS temporary Playwright scenario prepared (credentials not printed)")
    print("E2E HTTP workflow completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"E2E HTTP workflow failed: {error}", file=sys.stderr)
        sys.exit(1)
