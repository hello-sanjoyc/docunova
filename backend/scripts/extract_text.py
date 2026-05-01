import sys
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from docx import Document
import io
import os


def extract_text(file_path):
    if not os.path.exists(file_path):
        print("Error: File not found.", file=sys.stderr)
        sys.exit(1)

    ext = file_path.split(".")[-1].lower()

    try:
        if ext in ["png", "jpg", "jpeg"]:
            return pytesseract.image_to_string(Image.open(file_path))

        elif ext == "docx":
            doc = Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])

        elif ext == "pdf":
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                page_text = page.get_text()
                if not page_text.strip():
                    pix = page.get_pixmap()
                    img = Image.open(io.BytesIO(pix.tobytes()))
                    page_text = pytesseract.image_to_string(img)
                text += page_text
            return text

        print(f"Unsupported file format: {ext}", file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(f"Processing Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: extract_text.py <file_path>", file=sys.stderr)
        sys.exit(1)

    result = extract_text(sys.argv[1])
    print(result, end="")
