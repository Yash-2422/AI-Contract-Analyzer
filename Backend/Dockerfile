FROM python:3.11-slim

WORKDIR /app

# Production installs only the CPU-friendly web/API runtime. OCR and
# embeddings are remote providers; local model dependencies live in
# requirements-local.txt and Dockerfile.local.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=300 --retries=10 -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
