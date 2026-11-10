import io
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from typing import Tuple, Optional
from app.core.exceptions import ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
SUPPORTED_EXTENSIONS = {
    ".pdf", ".txt", ".md", ".json", ".csv",
    ".docx", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"
}
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


def sanitize_text(text: str) -> str:
    """Removes null bytes and standardizes unicode whitespace."""
    if not text:
        return ""
    text = text.replace("\x00", "")
    text = re.sub(r"[\r\n\v\f]+", "\n", text)
    return text.strip()


def detect_language(text: str) -> str:
    """Detects Indian languages or English from text using Unicode block analysis."""
    if not text:
        return "en"
    counts = {
        "te": len(re.findall(r"[\u0C00-\u0C7F]", text)),  # Telugu
        "hi": len(re.findall(r"[\u0900-\u097F]", text)),  # Devanagari (Hindi, Marathi)
        "ta": len(re.findall(r"[\u0B80-\u0BFF]", text)),  # Tamil
        "kn": len(re.findall(r"[\u0C80-\u0CFF]", text)),  # Kannada
        "ml": len(re.findall(r"[\u0D00-\u0D7F]", text)),  # Malayalam
        "bn": len(re.findall(r"[\u0980-\u09FF]", text)),  # Bengali
        "gu": len(re.findall(r"[\u0A80-\u0AFF]", text)),  # Gujarati
        "pa": len(re.findall(r"[\u0A00-\u0A7F]", text)),  # Gurmukhi (Punjabi)
        "or": len(re.findall(r"[\u0B00-\u0B7F]", text)),  # Odia
    }
    top_lang, top_count = max(counts.items(), key=lambda item: item[1])
    if top_count > 5:
        return top_lang
    return "en"


def _run_tesseract_ocr(image_bytes: bytes) -> str:
    """Executes local Tesseract OCR on raw image bytes."""
    try:
        proc = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", "eng"],
            input=image_bytes,
            capture_output=True,
            timeout=20,
        )
        if proc.returncode == 0:
            return proc.stdout.decode("utf-8", errors="replace").strip()
    except Exception as e:
        logger.warning(f"Tesseract OCR execution failed: {e}")
    return ""


def _extract_docx(file_bytes: bytes) -> Tuple[str, int]:
    """Extracts text and estimated pages from DOCX archive."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            xml_data = docx.read("word/document.xml")
            tree = ET.fromstring(xml_data)
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = []
            for p in tree.iterfind(".//w:p", ns):
                texts = [node.text for node in p.iterfind(".//w:t", ns) if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            full_text = "\n\n".join(paragraphs)
            cleaned = sanitize_text(full_text)
            if not cleaned:
                raise ValidationError("DOCX document contains no readable text.")
            page_count = max(1, len(cleaned) // 1500)
            return cleaned, page_count
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f"Failed to parse DOCX document: {str(e)}")


def extract_text_and_pages(
    file_bytes: bytes,
    filename: str,
    mime_type: str = "text/plain",
) -> Tuple[str, int]:
    """
    Extracts plain text and page count from supported file bytes.
    Supports PDF, DOCX, Images (OCR), and plain text formats.
    """
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if not file_bytes:
        raise ValidationError("Uploaded file is empty.")

    lower_filename = filename.lower()
    is_pdf = lower_filename.endswith(".pdf") or "pdf" in (mime_type or "").lower()
    is_docx = lower_filename.endswith(".docx") or "wordprocessingml" in (mime_type or "").lower()
    is_image = any(lower_filename.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]) or "image" in (mime_type or "").lower()

    if is_docx:
        return _extract_docx(file_bytes)

    if is_image:
        ocr_text = _run_tesseract_ocr(file_bytes)
        cleaned = sanitize_text(ocr_text)
        if not cleaned:
            raise ValidationError("Unable to extract text from image. Please ensure image contains clear printed text.")
        return cleaned, 1

    if is_pdf:
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            if page_count == 0:
                raise ValidationError("PDF document contains no pages.")

            extracted_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                extracted_pages.append(page_text.strip())

            full_text = "\n\n".join(extracted_pages)
            cleaned_text = sanitize_text(full_text)

            # If pypdf extracted empty text (e.g. scanned PDF), fallback to OCR via PyMuPDF rendering
            if not cleaned_text:
                try:
                    import pymupdf
                    pdf_doc = pymupdf.open(stream=file_bytes, filetype="pdf")
                    ocr_pages = []
                    for page in pdf_doc:
                        pix = page.get_pixmap()
                        img_bytes = pix.tobytes("png")
                        page_text = _run_tesseract_ocr(img_bytes)
                        if page_text:
                            ocr_pages.append(page_text)
                    if ocr_pages:
                        cleaned_text = sanitize_text("\n\n".join(ocr_pages))
                except Exception as ocr_err:
                    logger.warning(f"Scanned PDF OCR fallback failed: {ocr_err}")

            if not cleaned_text:
                raise ValidationError("Unable to extract text from PDF. Scanned or image-only PDFs require OCR.")

            return cleaned_text, page_count
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to parse PDF document: {str(e)}")

    # Plain text / Markdown / Structured text
    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = file_bytes.decode("latin-1")
        except Exception as e:
            raise ValidationError(f"Unsupported file encoding: {str(e)}")

    cleaned = sanitize_text(text)
    if not cleaned:
        raise ValidationError("Extracted document content is empty.")

    page_count = max(1, len(cleaned) // 1500)
    return cleaned, page_count

