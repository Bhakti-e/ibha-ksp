"""
OCR Service — Ibha KSP
=======================
Primary:  Catalyst Zia OCR  (zia.extract_optical_characters)
Fallback: HuggingFace TrOCR (microsoft/trocr-base-printed)
           — used only if Catalyst SDK / app context is unavailable.

Additionally runs Zia Text Analytics on the extracted text to surface:
  - crime-relevant keywords  (zia.get_keyword_extraction)
  - sentiment signal         (zia.get_sentiment_analysis)
These enrichments are returned in the response and used by the chat
screen to pre-populate a follow-up query.

Image Moderation pre-check (zia.moderate_image) is run before OCR when
the caller passes an image file.  If the image is flagged the upload is
rejected with a 422 so graphic or irrelevant content is never stored.

Zia SDK reference:
    app  = zcatalyst_sdk.initialize()
    zia  = app.zia()
    result = zia.extract_optical_characters(file_obj, {'language': 'eng', 'modelType': 'OCR'})
    result = zia.moderate_image(file_obj, options={'mode': 'moderate'})
    result = zia.get_keyword_extraction([text])
    result = zia.get_sentiment_analysis([text], [keyword])
"""

import io
import base64
import json
from typing import Optional
from lib.logging_utils import log_info, log_error

# ---------------------------------------------------------------------------
# Zia initialisation helper
# ---------------------------------------------------------------------------

def _get_zia():
    """
    Return a Zia client from the Catalyst SDK.
    Returns None when running outside a Catalyst environment (local dev).
    """
    try:
        import zcatalyst_sdk
        app = zcatalyst_sdk.initialize()
        return app.zia()
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Image moderation pre-check
# ---------------------------------------------------------------------------

def moderate_image_bytes(image_bytes: bytes) -> dict:
    """
    Run Zia image moderation on raw image bytes.

    Returns:
        {
            "safe": bool,
            "labels": list   # moderation labels returned by Zia
        }

    Falls back to {"safe": True, "labels": []} when Zia is unavailable
    so the upload is not blocked in local dev.
    """
    zia = _get_zia()
    if zia is None:
        log_info("Zia unavailable — skipping image moderation (local dev)", {})
        return {"safe": True, "labels": []}

    try:
        file_obj = io.BytesIO(image_bytes)
        result = zia.moderate_image(file_obj, options={"mode": "moderate"})

        # Zia returns a list of label objects; flag if any unsafe label present
        labels = result if isinstance(result, list) else result.get("labels", [])
        unsafe = [l for l in labels if str(l.get("label", "")).lower() in
                  {"explicit", "suggestive", "violence", "gore"}]

        return {"safe": len(unsafe) == 0, "labels": labels}

    except Exception as e:
        log_error("Zia image moderation error — allowing upload", {"error": str(e)}, e)
        return {"safe": True, "labels": []}


# ---------------------------------------------------------------------------
# OCR — Zia primary, TrOCR fallback
# ---------------------------------------------------------------------------

def extract_text_zia(image_bytes: bytes) -> Optional[str]:
    """
    Extract text using Catalyst Zia OCR.
    Returns None on any error so the caller can fall back gracefully.
    """
    zia = _get_zia()
    if zia is None:
        return None

    try:
        file_obj = io.BytesIO(image_bytes)
        result = zia.extract_optical_characters(
            file_obj,
            {"language": "eng", "modelType": "OCR"}
        )
        # Zia returns a dict; text is in result["text"] or result["ocr_result"]
        text = (
            result.get("text")
            or result.get("ocr_result")
            or result.get("response", {}).get("text")
            or ""
        )
        log_info("Zia OCR succeeded", {"char_count": len(text)})
        return text.strip() if text else None

    except Exception as e:
        log_error("Zia OCR failed — will try fallback", {"error": str(e)}, e)
        return None


def extract_text_trocr_fallback(image_bytes: bytes) -> str:
    """
    Fallback OCR using HuggingFace TrOCR (microsoft/trocr-base-printed).
    Raises RuntimeError if transformers / torch are not installed.
    """
    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        from PIL import Image
    except ImportError:
        raise RuntimeError(
            "Fallback OCR requires: pip install transformers torch Pillow"
        )

    MODEL_ID = "microsoft/trocr-base-printed"
    log_info("TrOCR fallback OCR started", {"model": MODEL_ID})

    processor = TrOCRProcessor.from_pretrained(MODEL_ID)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    pixel_values = processor(images=image, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values)
    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    log_info("TrOCR fallback OCR succeeded", {"char_count": len(text)})
    return text.strip()


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """
    Public entry point: try Zia first, fall back to TrOCR.

    Args:
        image_bytes: Raw bytes of a PNG/JPEG image.

    Returns:
        Extracted text string.

    Raises:
        RuntimeError: if both Zia and fallback fail.
    """
    # 1. Try Zia
    text = extract_text_zia(image_bytes)
    if text:
        return text

    # 2. Fall back to TrOCR
    log_info("Falling back to local TrOCR", {})
    return extract_text_trocr_fallback(image_bytes)


def extract_text_from_base64(b64_string: str) -> str:
    """
    Run OCR on a base64-encoded image (with or without data-URI prefix).
    """
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    image_bytes = base64.b64decode(b64_string)
    return extract_text_from_image_bytes(image_bytes)


# ---------------------------------------------------------------------------
# Text analytics — Zia keyword extraction + sentiment
# ---------------------------------------------------------------------------

def analyse_text(text: str) -> dict:
    """
    Run Zia Text Analytics on extracted OCR text.

    Runs:
      - zia.get_keyword_extraction([text])
      - zia.get_sentiment_analysis([text], keywords)

    Returns:
        {
            "keywords": ["theft", "accused", ...],
            "sentiment": "positive" | "negative" | "neutral",
            "sentiment_score": float
        }

    Falls back to {} when Zia is unavailable.
    """
    if not text or len(text.strip()) < 10:
        return {}

    zia = _get_zia()
    if zia is None:
        log_info("Zia unavailable — skipping text analytics (local dev)", {})
        return {}

    result = {}

    # --- Keyword extraction ---
    try:
        kw_resp = zia.get_keyword_extraction([text])
        # Zia returns list of lists; flatten to list of strings
        keywords = []
        if isinstance(kw_resp, list):
            for item in kw_resp:
                if isinstance(item, list):
                    keywords.extend([k.get("keyword", "") for k in item if isinstance(k, dict)])
                elif isinstance(item, dict):
                    keywords.append(item.get("keyword", ""))
        result["keywords"] = [k for k in keywords if k]
        log_info("Zia keyword extraction succeeded", {"count": len(result["keywords"])})
    except Exception as e:
        log_error("Zia keyword extraction failed", {"error": str(e)}, e)
        result["keywords"] = []

    # --- Sentiment analysis (pass extracted keywords as entities) ---
    try:
        entities = result.get("keywords", [])[:5]  # limit to avoid large payloads
        sent_resp = zia.get_sentiment_analysis([text], entities or ["crime"])
        # Zia returns list; grab first result
        if isinstance(sent_resp, list) and sent_resp:
            first = sent_resp[0]
            result["sentiment"] = first.get("sentiment", "neutral")
            result["sentiment_score"] = first.get("score", 0.0)
        else:
            result["sentiment"] = "neutral"
            result["sentiment_score"] = 0.0
        log_info("Zia sentiment analysis succeeded", {"sentiment": result.get("sentiment")})
    except Exception as e:
        log_error("Zia sentiment analysis failed", {"error": str(e)}, e)
        result["sentiment"] = "neutral"
        result["sentiment_score"] = 0.0

    return result


# ---------------------------------------------------------------------------
# Catalyst HTTP handler  — POST /ocr/extract
# ---------------------------------------------------------------------------

def handler(request: dict) -> dict:
    """
    POST /ocr/extract

    Accepts:
        JSON body: { "image_base64": "<base64 string>" }
        OR multipart form-data with field "file" (handled by local_server.py)

    Returns:
        {
            "text":          str,
            "char_count":    int,
            "ocr_engine":    "zia" | "trocr_fallback",
            "moderation":    { "safe": bool, "labels": list },
            "analytics":     { "keywords": list, "sentiment": str, "sentiment_score": float }
        }
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
            body = json.loads(body)

        image_base64 = body.get("image_base64")
        if not image_base64:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "image_base64 field is required"}),
            }

        image_bytes = base64.b64decode(
            image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
        )

        # 1. Image moderation pre-check
        moderation = moderate_image_bytes(image_bytes)
        if not moderation["safe"]:
            return {
                "statusCode": 422,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "error": "Image failed content moderation and cannot be processed.",
                    "moderation": moderation,
                }),
            }

        # 2. OCR — Zia first, TrOCR fallback
        zia_text = extract_text_zia(image_bytes)
        if zia_text:
            ocr_engine = "zia"
            text = zia_text
        else:
            text = extract_text_trocr_fallback(image_bytes)
            ocr_engine = "trocr_fallback"

        # 3. Text analytics on extracted text
        analytics = analyse_text(text)

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "text":       text,
                "char_count": len(text),
                "ocr_engine": ocr_engine,
                "moderation": moderation,
                "analytics":  analytics,
            }),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        log_error("OCR handler error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
