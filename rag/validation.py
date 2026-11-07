from pathlib import Path
import io
import zipfile

from rest_framework import serializers


MAX_DOCUMENT_SIZE = 25 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".webp"}
PDF_EXTENSION = ".pdf"


def validate_document_upload(upload):
    """Validate documents before they are copied into MEDIA_ROOT."""
    if not upload:
        raise serializers.ValidationError("A document is required.")
    if upload.size > MAX_DOCUMENT_SIZE:
        raise serializers.ValidationError("Document must be 25 MB or smaller.")
    extension = Path(upload.name).suffix.lower()
    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise serializers.ValidationError(
            "Unsupported document type. Upload PDF, DOC, DOCX, TXT, PNG, JPG, or JPEG."
        )
    current_position = upload.tell() if hasattr(upload, "tell") else 0
    raw = upload.read()
    if hasattr(upload, "seek"):
        upload.seek(current_position)
    if extension == ".pdf":
        return _validate_pdf_bytes(upload, raw)
    if extension in {".png", ".jpg", ".jpeg", ".webp"}:
        _validate_image_bytes(extension, raw)
    elif extension == ".docx":
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                if "[Content_Types].xml" not in archive.namelist():
                    raise ValueError
                archive.testzip()
        except (zipfile.BadZipFile, ValueError):
            raise serializers.ValidationError("The uploaded DOCX file is corrupt or invalid.")
    elif extension == ".doc":
        if not raw.startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
            raise serializers.ValidationError("The uploaded DOC file has an invalid file signature.")
    elif extension == ".txt":
        try:
            raw.decode("utf-8")
        except UnicodeDecodeError:
            raise serializers.ValidationError("The uploaded text file is not valid UTF-8.")
    return upload


def validate_pdf_upload(upload):
    """Strict validation used by the canonical EADAES subject pipeline."""
    if not upload:
        raise serializers.ValidationError("A PDF document is required.")
    if upload.size > MAX_DOCUMENT_SIZE:
        raise serializers.ValidationError("Document must be 25 MB or smaller.")
    if Path(upload.name).suffix.lower() != PDF_EXTENSION:
        raise serializers.ValidationError("EADAES documents must be uploaded as PDF files.")
    current_position = upload.tell() if hasattr(upload, "tell") else 0
    raw = upload.read()
    if hasattr(upload, "seek"):
        upload.seek(current_position)
    _validate_pdf_bytes(upload, raw)
    return upload


def validate_answer_sheet_upload(upload):
    upload = validate_document_upload(upload)
    if Path(upload.name).suffix.lower() not in {".pdf", ".png", ".jpg", ".jpeg", ".webp"}:
        raise serializers.ValidationError("Answer sheets must be PDF, PNG, JPG, JPEG, or WEBP files.")
    return upload


def _validate_pdf_bytes(upload, raw):
    if not raw.startswith(b"%PDF-"):
        raise serializers.ValidationError("The uploaded file is not a valid PDF document.")
    try:
        try:
            import pymupdf as fitz
        except ImportError:  # pragma: no cover - older PyMuPDF import name
            import fitz
        document = fitz.open(stream=raw, filetype="pdf")
        try:
            if document.needs_pass:
                raise serializers.ValidationError("Password-protected PDFs are not supported.")
            if document.page_count < 1:
                raise serializers.ValidationError("The PDF contains no pages.")
        finally:
            document.close()
    except serializers.ValidationError:
        raise
    except Exception:
        raise serializers.ValidationError("The uploaded PDF is corrupt or cannot be opened.")
    return upload


def _validate_image_bytes(extension, raw):
    valid = (
        extension == ".png" and raw.startswith(b"\x89PNG\r\n\x1a\n")
        or extension in {".jpg", ".jpeg"} and raw.startswith(b"\xff\xd8\xff")
        or extension == ".webp" and len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    )
    if not valid:
        raise serializers.ValidationError("The file extension does not match a valid PNG, JPEG, or WEBP image.")
    try:
        from PIL import Image
        with Image.open(io.BytesIO(raw)) as image:
            image.verify()
    except ImportError:  # Signature validation remains available without Pillow.
        return
    except Exception:
        raise serializers.ValidationError("The uploaded image is corrupt or cannot be opened.")
