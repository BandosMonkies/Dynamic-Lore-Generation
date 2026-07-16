# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Qwen NPC AI Flask Server
#
# Base image already has:  PyTorch 2.3.0 + CUDA 12.1 + cuDNN 8
# We install Python deps on top, then copy the server code.
# The model weights (Qwen-NPC-INT4/) are NOT baked in — they are
# bind-mounted at runtime via docker-compose.yml.
# ─────────────────────────────────────────────────────────────────────────────

FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

# ---------- system deps -------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ---------- working directory -------------------------------------------------
WORKDIR /app

# ---------- Python dependencies -----------------------------------------------
# Copy requirements first so Docker layer-cache skips pip on code-only changes.
COPY requirements.txt .

# Install everything from requirements.txt.
# - torch is already in the base image; we skip reinstalling it to keep
#   the layer small but allow other packages to install normally.
# - bitsandbytes must match the CUDA version in the base image (12.x).
# - We install with --no-deps for torch/torchvision to avoid conflicts.
RUN pip install --no-cache-dir \
        flask \
        flask-cors \
        transformers \
        accelerate \
        bitsandbytes \
        safetensors \
        sentencepiece \
        protobuf \
        peft \
        huggingface_hub \
        numpy \
        requests \
        regex \
        tokenizers \
        tqdm \
        pyyaml \
        filelock \
        packaging \
        psutil

# ---------- application code --------------------------------------------------
# Only copy server.py — model weights are mounted at runtime.
COPY server.py .

# ---------- runtime -----------------------------------------------------------
# The model directory will be bind-mounted to /app/Qwen-NPC-INT4
EXPOSE 5000

# Health check so docker-compose frontend waits for the server to be ready.
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "server.py"]
