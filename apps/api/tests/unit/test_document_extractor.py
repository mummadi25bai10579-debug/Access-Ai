import unittest
import io
import zipfile
import xml.etree.ElementTree as ET
import pymupdf
from app.services.document_processing.extractor import (
    extract_text_and_pages,
    sanitize_text,
    detect_language,
)
from app.core.exceptions import ValidationError
from pypdf import PdfWriter

class TestDocumentExtractor(unittest.TestCase):
    def test_sanitize_text_removes_null_bytes(self):
        raw = "Hello\x00 World\r\n\r\nTest"
        cleaned = sanitize_text(raw)
        self.assertEqual(cleaned, "Hello World\nTest")

    def test_empty_file_raises_validation_error(self):
        with self.assertRaises(ValidationError) as ctx:
            extract_text_and_pages(b"", "empty.txt", "text/plain")
        self.assertIn("empty", str(ctx.exception).lower())

    def test_plain_text_extraction(self):
        content = b"Scholarship rules and guidelines for applicants."
        text, pages = extract_text_and_pages(content, "rules.txt", "text/plain")
        self.assertEqual(text, "Scholarship rules and guidelines for applicants.")
        self.assertEqual(pages, 1)

    def test_pdf_extraction_with_pypdf(self):
        # Generate an in-memory PDF with text annotations/stream
        writer = PdfWriter()
        page = writer.add_blank_page(width=200, height=200)
        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)
        # Note: blank page produces empty text, which must raise ValidationError asking for OCR
        with self.assertRaises(ValidationError) as ctx:
            extract_text_and_pages(buf.getvalue(), "blank.pdf", "application/pdf")
        self.assertIn("require ocr", str(ctx.exception).lower())

    def test_docx_extraction(self):
        bio = io.BytesIO()
        with zipfile.ZipFile(bio, "w") as zf:
            xml_content = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
            <w:document xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'>
              <w:body>
                <w:p><w:r><w:t>AccessAI DOCX Ingestion Test.</w:t></w:r></w:p>
                <w:p><w:r><w:t>Second paragraph of verified guidance.</w:t></w:r></w:p>
              </w:body>
            </w:document>"""
            zf.writestr("word/document.xml", xml_content)
        bio.seek(0)
        text, pages = extract_text_and_pages(bio.getvalue(), "scheme_doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        self.assertIn("AccessAI DOCX Ingestion Test.", text)
        self.assertIn("Second paragraph of verified guidance.", text)
        self.assertGreaterEqual(pages, 1)

    def test_detect_language(self):
        self.assertEqual(detect_language("This is an English welfare circular."), "en")
        # Telugu text sample: జగనన్న విద్యా దీవెన పథకం
        telugu_sample = "జగనన్న విద్యా దీవెన పథకం పూర్తి ఫీజు రీయింబర్స్ మెంట్ అందిస్తుంది"
        self.assertEqual(detect_language(telugu_sample), "te")
        # Hindi text sample: प्रधानमंत्री किसान सम्मान निधि योजना
        hindi_sample = "प्रधानमंत्री किसान सम्मान निधि योजना के तहत किसानों को सहायता"
        self.assertEqual(detect_language(hindi_sample), "hi")

    def test_image_ocr_with_tesseract(self):
        doc = pymupdf.open()
        page = doc.new_page(width=300, height=80)
        page.insert_text((20, 45), "ACCESSAI OCR VERIFICATION", fontsize=16)
        pix = page.get_pixmap()
        img_bytes = pix.tobytes("png")

        text, pages = extract_text_and_pages(img_bytes, "scan_sample.png", "image/png")
        self.assertIn("ACCESSAI", text)
        self.assertEqual(pages, 1)

if __name__ == "__main__":
    unittest.main()

