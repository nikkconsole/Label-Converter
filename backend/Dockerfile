FROM python:3.11-slim

# Supported environment variables:
#   FLASK_ENV   - Flask runtime mode (default: production)
#   REDIS_URL   - Redis connection string (default: redis://localhost:6379/0)
#   UPLOAD_DIR  - Upload directory path (default: /app/uploads)
#   OUTPUT_DIR  - Output directory path (default: /app/outputs)

WORKDIR /app

ENV FLASK_ENV=production
ENV REDIS_URL=redis://localhost:6379/0
ENV UPLOAD_DIR=/app/uploads
ENV OUTPUT_DIR=/app/outputs

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

RUN mkdir -p /app/uploads /app/outputs

EXPOSE 5000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
