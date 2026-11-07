import base64
import mimetypes
from pathlib import Path


def image_parts_for_document(path, max_pages=None, only_pages=None):
    """Return Groq-compatible image data URLs for image files or PDF pages."""
    extension = Path(path).suffix.lower()
    if extension in {".png", ".jpg", ".jpeg", ".webp"}:
        mime = mimetypes.guess_type(path)[0] or "image/jpeg"
        with open(path, "rb") as handle:
            encoded = base64.b64encode(handle.read()).decode("ascii")
        return [{"page_no": 1, "data_url": f"data:{mime};base64,{encoded}"}]

    if extension != ".pdf":
        return []

    try:
        import pymupdf as fitz
    except ImportError:
        import fitz

    parts = []
    with fitz.open(path) as document:
        selected = set(only_pages) if only_pages is not None else None
        for index, page in enumerate(document, start=1):
            if selected is not None and index not in selected:
                continue
            if max_pages is not None and index > max_pages:
                raise ValueError(f"Vision page limit would omit page {index}; refusing to truncate the document.")
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            encoded = base64.b64encode(pixmap.tobytes("jpeg")).decode("ascii")
            parts.append({"page_no": index, "data_url": f"data:image/jpeg;base64,{encoded}"})
    return parts
