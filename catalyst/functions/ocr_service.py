"""
OCR Service — Ibha KSP
=======================
Extracts text from scanned FIR images / PDF pages using a HuggingFace
vision-language model, then wraps the result in a LlamaIndex Document so
it can optionally be indexed and queried via the retrieval pipeline.

HuggingFace model used (prototype):
    microsoft/trocr-base-printed
    https://huggingface.co/microsoft/trocr-base-printed

    This is a lightweight, open-source OCR model that works well for
    printed text in forms and documents.  For handwritten Kannada text
    a fine-tuned regional model would be substituted in production.

Production note:
    For production, evaluate:
    - google/deplot (chart/table understanding)
    - facebook/nougat-base (scientific / structured documents)
    - A fine-tuned Kannada OCR model on Hub

LlamaIndex docs: https://docs.llamaindex.ai/en/stable/
"""

import io
import base64
import json
from typing import Optional

# --------------------------------------------------------------------------
# Lazy-load heavy dependencies so the module imports fast when OCR is unused
# --------------------------------------------------------------------------

_processor = None
_model = None

MODEL_ID = "microsoft/trocr-base-printed"


def _load_model():
    """Load TrOCR processor + model on first call (lazy loading)."""
    global _processor, _model
    if _processor is not None:
        return

    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        print(f"[OCR] Loading model: {MODEL_ID}")
        _processor = TrOCRProcessor.from_pretrained(MODEL_ID)
        _model     = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)
        print("[OCR] Model loaded successfully")
    except ImportError:
        raise RuntimeError(
            "transformers and torch must be installed.\n"
            "Run: pip install transformers torch Pillow"
        )


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """
    Run OCR on raw image bytes.

    Args:
        image_bytes: Raw bytes of a PNG/JPEG image.

    Returns:
        Extracted text string.
    """
    from PIL import Image

    _load_model()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    pixel_values = _processor(images=image, return_tensors="pt").pixel_values
    generated_ids = _model.generate(pixel_values)
    text = _processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    return text.strip()


def extract_text_from_base64(b64_string: str) -> str:
    """
    Run OCR on a base64-encoded image.

    Args:
        b64_string: Base64-encoded image (with or without data-URI prefix).

    Returns:
        Extracted text string.
    """
    # Strip data URI prefix if present (e.g. "data:image/png;base64,...")
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    image_bytes = base64.b64decode(b64_string)
    return extract_text_from_image_bytes(image_bytes)


def extract_text_to_llamaindex_document(image_bytes: bytes, metadata: Optional[dict] = None):
    """
    Run OCR and wrap result in a LlamaIndex Document.

    This allows the extracted text to be indexed, chunked, and queried
    via LlamaIndex's retrieval pipeline.

    Args:
        image_bytes: Raw image bytes.
        metadata: Optional dict to attach to the Document (e.g. FIR number,
                  station, upload timestamp).

    Returns:
        llama_index.core.Document
    """
    try:
        from llama_index.core import Document
    except ImportError:
        raise RuntimeError(
            "llama-index-core must be installed.\n"
            "Run: pip install llama-index-core"
        )

    text = extract_text_from_image_bytes(image_bytes)

    doc = Document(
        text=text,
        metadata=metadata or {},
    )
    return doc


# --------------------------------------------------------------------------
# Catalyst HTTP handler
# --------------------------------------------------------------------------

def handler(request: dict) -> dict:
    """
    POST /ocr/extract

    Accepts:
        - JSON body: { "image_base64": "<base64 string>" }
        - OR multipart form-data with field "file" (handled by local_server.py)

    Returns:
        { "text": "<extracted text>", "char_count": int }
    """
    CORS_HEADERS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    try:
        body = request.get("body", {})
        if isinstance(body, str):
            import json as _json
            body = _json.loads(body)

        image_base64 = body.get("image_base64")
        if not image_base64:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "image_base64 field is required"}),
            }

        text = extract_text_from_base64(image_base64)

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "text": text,
                "char_count": len(text),
                "model": MODEL_ID,
            }),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
