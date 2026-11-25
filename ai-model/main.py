import os
import io
import json
import time
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, UnidentifiedImageError
import numpy as np
from dotenv import load_dotenv

# LiteRT / TFLite runtime
try:
    from ai_edge_litert.interpreter import Interpreter
except ImportError:
    try:
        from tflite_runtime.interpreter import Interpreter
    except ImportError:
        import tensorflow as tf
        Interpreter = tf.lite.Interpreter

# Optional local semantic OOD verifier (MobileNetV3-Small ImageNet weights cached on disk)
try:
    import torch
    from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
    TORCHVISION_AVAILABLE = True
except ImportError:
    TORCHVISION_AVAILABLE = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pmg-ai-service")

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(BASE_DIR, "Trained Model for PMG", "gemstone_final_model.tflite")
)
LABELS_PATH = os.getenv(
    "LABELS_PATH",
    os.path.join(BASE_DIR, "Trained Model for PMG", "labels.json")
)

# High-confidence classification boundary ("Real" vs "Uncertain")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))

# Calibrated Out-of-Distribution / Non-Gemstone Guardrail thresholds
NOT_GEMSTONE_THRESHOLD = float(os.getenv("NOT_GEMSTONE_THRESHOLD", "0.25"))
MIN_GEMSTONE_CONFIDENCE = float(os.getenv("MIN_GEMSTONE_CONFIDENCE", "0.25"))
MAX_NORMALIZED_ENTROPY = float(os.getenv("MAX_NORMALIZED_ENTROPY", "0.65"))
MIN_CONFIDENCE_MARGIN = float(os.getenv("MIN_CONFIDENCE_MARGIN", "0.08"))

INPUT_SHAPE = (224, 224)

# Clear everyday non-gemstone ImageNet categories (fruits, vegetables, bottles,
# electronics, furniture, apparel, animals, vehicles, ordinary rocks/landscapes)
OOD_OBJECT_CATEGORIES = {
    # Bottles, drinkware & containers
    "pop bottle", "water bottle", "beer bottle", "wine bottle", "pill bottle",
    "milk can", "beer glass", "water jug", "coffee mug", "teapot", "pitcher",
    "bucket", "barrel", "crate", "carton", "envelope",
    # Fruits, vegetables & food
    "Granny Smith", "banana", "orange", "lemon", "fig", "pineapple",
    "strawberry", "pomegranate", "custard apple", "jackfruit",
    "bell pepper", "cucumber", "zucchini", "broccoli", "cauliflower",
    "head cabbage", "artichoke", "mushroom", "corn", "acorn squash",
    "butternut squash", "spaghetti squash", "mashed potato", "hotdog",
    "cheeseburger", "pizza", "bagel", "pretzel", "ice cream", "plate",
    "guacamole", "chocolate sauce", "meat loaf", "carbonara", "trifle",
    # Ordinary rocks & landscapes
    "cliff", "stone wall", "megalith", "promontory", "breakwater",
    "sandbar", "volcano", "lakeside", "seashore", "valley", "alp",
    # Electronics & appliances
    "cellular telephone", "iPod", "laptop", "notebook", "desktop computer",
    "computer keyboard", "space bar", "mouse", "monitor", "screen",
    "television", "remote control", "joystick", "reflex camera", "Polaroid camera",
    "printer", "microwave", "toaster", "refrigerator", "electric fan",
    "washer", "vacuum", "modem", "hard disc",
    # Household items, apparel & accessories
    "folding chair", "rocking chair", "barber chair", "desk", "dining table",
    "studio couch", "bookcase", "pillow", "quilt", "table lamp", "lampshade",
    "broom", "scissors", "hammer", "screwdriver", "ballpoint", "fountain pen",
    "rule", "book jacket", "backpack", "handbag", "wallet", "umbrella",
    "running shoe", "sandal", "Loafer", "clog", "cowboy boot", "sock",
    "sunglasses", "sunglass", "jersey", "suit", "trench coat", "miniskirt",
    "sweatshirt", "jean", "bikini", "brassiere",
    # Vehicles & animals
    "sports car", "racer", "convertible", "minivan", "pickup", "trailer truck",
    "bicycle-built-for-two", "mountain bike", "moped", "motor scooter",
    "school bus", "airliner", "tabby", "tiger cat", "Persian cat",
    "golden retriever", "Labrador retriever", "beagle", "German shepherd",
    "pug", "chihuahua", "robin", "goldfish",
}

app = FastAPI(
    title="Price My Gem - Gemstone Identification AI Service",
    description="Real-time Gemstone Classification & Authenticity Inference Engine",
    version="2.1.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
model_state = {
    "interpreter": None,
    "input_index": None,
    "output_index": None,
    "labels": [],
    "not_gemstone_index": None,
    "loaded": False,
    "load_error": None,
    "ood_model": None,
    "ood_preprocess": None,
    "ood_categories": [],
    "ood_mask": None,
    "ood_loaded": False,
}


def load_ood_semantic_guard():
    """Loads cached ImageNet MobileNetV3-Small offline for everyday-object OOD rejection."""
    if not TORCHVISION_AVAILABLE:
        return
    try:
        weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
        ood_model = mobilenet_v3_small(weights=weights).eval()
        categories = weights.meta["categories"]
        ood_mask = np.array(
            [1.0 if cat in OOD_OBJECT_CATEGORIES else 0.0 for cat in categories],
            dtype=np.float32,
        )
        model_state["ood_model"] = ood_model
        model_state["ood_preprocess"] = weights.transforms()
        model_state["ood_categories"] = categories
        model_state["ood_mask"] = ood_mask
        model_state["ood_loaded"] = True
        logger.info("Semantic OOD verifier (MobileNetV3-Small) loaded from local cache.")
    except Exception as e:
        logger.warning(f"Semantic OOD verifier disabled (not cached offline): {e}")
        model_state["ood_loaded"] = False


def load_ai_model():
    """Loads the TFLite gemstone classification model, labels, and semantic OOD guard."""
    try:
        logger.info(f"Loading labels from: {LABELS_PATH}")
        if not os.path.exists(LABELS_PATH):
            raise FileNotFoundError(f"Labels file not found at: {LABELS_PATH}")

        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            labels = json.load(f)

        not_gem_idx = None
        for idx, label in enumerate(labels):
            if label.lower().replace(" ", "_") == "not_gemstone":
                not_gem_idx = idx
                break

        logger.info(
            f"Loaded {len(labels)} labels successfully (Not_Gemstone index={not_gem_idx})."
        )

        logger.info(f"Loading TFLite model from: {MODEL_PATH}")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

        interpreter = Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        model_state["interpreter"] = interpreter
        model_state["input_index"] = input_details[0]["index"]
        model_state["output_index"] = output_details[0]["index"]
        model_state["labels"] = labels
        model_state["not_gemstone_index"] = not_gem_idx
        model_state["loaded"] = True
        model_state["load_error"] = None

        logger.info(
            f"Model successfully loaded. Input index={model_state['input_index']} "
            f"shape={input_details[0]['shape']} dtype={input_details[0]['dtype']}, "
            f"Output index={model_state['output_index']} shape={output_details[0]['shape']}"
        )
    except Exception as e:
        logger.error(f"Failed to load AI model: {e}", exc_info=True)
        model_state["loaded"] = False
        model_state["load_error"] = str(e)

    load_ood_semantic_guard()


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing AI Inference Engine on startup...")
    load_ai_model()


@app.get("/health")
async def health_check():
    """Health check endpoint providing model readiness and configuration status."""
    return {
        "status": "healthy" if model_state["loaded"] else "degraded",
        "service": "Price My Gem AI Classification Service",
        "model_loaded": model_state["loaded"],
        "semantic_ood_loaded": model_state["ood_loaded"],
        "model_path": MODEL_PATH,
        "classes_count": len(model_state["labels"]),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "not_gemstone_threshold": NOT_GEMSTONE_THRESHOLD,
        "min_gemstone_confidence": MIN_GEMSTONE_CONFIDENCE,
        "min_confidence_margin": MIN_CONFIDENCE_MARGIN,
        "max_normalized_entropy": MAX_NORMALIZED_ENTROPY,
        "load_error": model_state["load_error"],
    }


def preprocess_image(image_bytes: bytes):
    """Preprocesses raw image bytes to match MobileNetV2 training pipeline."""
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        orig_size = pil_image.size
        orig_mode = pil_image.mode
        pil_image = ImageOps.exif_transpose(pil_image)
    except (UnidentifiedImageError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    resized = pil_image.resize(INPUT_SHAPE, Image.Resampling.BILINEAR)
    img_array = np.array(resized, dtype=np.float32)
    tensor_input = np.expand_dims(img_array, axis=0)
    return pil_image, tensor_input, orig_size, orig_mode


def check_semantic_ood(pil_image: Image.Image):
    """Runs local ImageNet MobileNetV3-Small check to catch everyday non-gemstone objects."""
    if not model_state["ood_loaded"]:
        return 0.0, "", 0.0

    x = model_state["ood_preprocess"](pil_image).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model_state["ood_model"](x)[0], dim=0).cpu().numpy()

    ood_mass = float(np.sum(probs * model_state["ood_mask"]))
    top_idx = int(np.argmax(probs))
    top_label = model_state["ood_categories"][top_idx]
    top_prob = float(probs[top_idx])
    return ood_mass, top_label, top_prob


@app.post("/predict")
async def predict_gemstone(file: UploadFile = File(...)):
    """Runs gemstone identification with multi-signal non-gemstone/OOD verification."""
    if not model_state["loaded"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI model is not ready: {model_state['load_error']}"
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}"
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    t0 = time.time()

    pil_image, tensor_input, orig_size, orig_mode = preprocess_image(contents)

    interpreter = model_state["interpreter"]
    input_idx = model_state["input_index"]
    output_idx = model_state["output_index"]
    labels = model_state["labels"]
    not_gem_idx = model_state["not_gemstone_index"]

    interpreter.set_tensor(input_idx, tensor_input)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_idx)[0]  # shape: (88,)

    not_gem_prob = float(predictions[not_gem_idx]) if not_gem_idx is not None else 0.0
    gemstone_total_prob = float(max(0.0, 1.0 - not_gem_prob))

    probs_clipped = np.clip(predictions, 1e-12, 1.0)
    norm_entropy = float(-np.sum(probs_clipped * np.log(probs_clipped)) / np.log(len(labels)))

    top5_indices = np.argsort(predictions)[::-1][:5]
    top_idx = int(top5_indices[0])
    second_idx = int(top5_indices[1])
    top_label = labels[top_idx]
    top_confidence = float(predictions[top_idx])
    second_confidence = float(predictions[second_idx])
    conf_margin = top_confidence - second_confidence

    ood_mass, ood_top_label, ood_top_prob = check_semantic_ood(pil_image)

    inference_ms = round((time.time() - t0) * 1000, 2)

    top_candidates = [
        {"gemstone": labels[i], "confidence": round(float(predictions[i]), 4)}
        for i in top5_indices
    ]

    top3_summary = ", ".join(
        f"{c['gemstone']}={c['confidence']*100:.1f}%" for c in top_candidates[:3]
    )
    logger.info(
        f"Inference ({orig_mode} {orig_size} -> {tensor_input.shape}): "
        f"top={top_label} ({top_confidence*100:.2f}%), margin={conf_margin:.3f}, "
        f"Not_Gemstone={not_gem_prob*100:.2f}%, H_norm={norm_entropy:.3f}, "
        f"OOD=({ood_top_label}:{ood_top_prob:.2f}, mass={ood_mass:.2f}), "
        f"top3=[{top3_summary}] in {inference_ms}ms"
    )

    # ── Multi-Signal Out-of-Distribution / Non-Gemstone Guardrail ────────────
    is_not_gemstone_top = top_label.lower().replace(" ", "_") == "not_gemstone"
    is_high_not_gem_prob = not_gem_prob >= NOT_GEMSTONE_THRESHOLD
    is_below_min_conf = top_confidence < MIN_GEMSTONE_CONFIDENCE
    is_high_entropy = norm_entropy > MAX_NORMALIZED_ENTROPY
    is_low_margin_ambiguous = top_confidence < 0.55 and conf_margin < MIN_CONFIDENCE_MARGIN
    is_semantic_ood = (
        (
            top_confidence < 0.85
            and (
                (ood_top_label in OOD_OBJECT_CATEGORIES and ood_top_prob >= 0.35)
                or ood_mass >= 0.45
            )
        )
        or ood_mass >= 0.72
    )

    if (
        is_not_gemstone_top
        or is_high_not_gem_prob
        or is_below_min_conf
        or is_high_entropy
        or is_low_margin_ambiguous
        or is_semantic_ood
    ):
        if is_not_gemstone_top:
            reason = "Not_Gemstone class predicted"
        elif is_high_not_gem_prob:
            reason = f"Not_Gemstone probability {not_gem_prob:.3f} >= {NOT_GEMSTONE_THRESHOLD}"
        elif is_semantic_ood:
            reason = f"Everyday non-gemstone object detected ({ood_top_label}={ood_top_prob:.2f}, ood_mass={ood_mass:.2f})"
        elif is_low_margin_ambiguous:
            reason = f"Ambiguous low-margin prediction (top={top_confidence:.3f}, margin={conf_margin:.3f})"
        elif is_below_min_conf:
            reason = f"Top confidence {top_confidence:.3f} < {MIN_GEMSTONE_CONFIDENCE}"
        else:
            reason = f"High softmax entropy {norm_entropy:.3f} > {MAX_NORMALIZED_ENTROPY}"

        logger.warning(f"Rejected non-gemstone/OOD item: {reason}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "is_gemstone": False,
                "gemstone_type": "Not a Gemstone",
                "confidence": round(top_confidence, 4),
                "gemstone_probability": round(gemstone_total_prob, 4),
                "not_gemstone_probability": round(not_gem_prob, 4),
                "authenticity": "Not a Gemstone",
                "rejection_reason": reason,
                "message": "This item is not a gemstone. Please scan a valid gemstone.",
                "top_candidates": top_candidates,
                "inference_time_ms": inference_ms,
            }
        )

    authenticity = "Real" if top_confidence >= CONFIDENCE_THRESHOLD else "Uncertain"

    return {
        "is_gemstone": True,
        "gemstone_type": top_label,
        "confidence": round(top_confidence, 4),
        "gemstone_probability": round(gemstone_total_prob, 4),
        "not_gemstone_probability": round(not_gem_prob, 4),
        "authenticity": authenticity,
        "message": (
            f"Successfully identified {top_label} with {top_confidence*100:.1f}% confidence."
            if authenticity == "Real"
            else f"Detected gemstone (likely {top_label}, {top_confidence*100:.1f}% confidence)."
        ),
        "top_candidates": top_candidates,
        "inference_time_ms": inference_ms,
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
