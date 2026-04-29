FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Docling and OCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Pre-install torch CPU to avoid massive CUDA dependencies and prevent build OOM/timeout
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary files (handled by .dockerignore)
COPY . .

# Ensure the port is flexible for cloud providers
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
