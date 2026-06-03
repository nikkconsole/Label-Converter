# Format Converter

A COCO-to-YOLO dataset converter with a Flask backend and React/Vite frontend, containerized with Docker.

## Project Structure

```
Format Converter/
├── backend/                 # Flask REST API
│   ├── analytics/           # Dataset statistics & class distribution
│   ├── converters/          # COCO → YOLO, COCO → OBB conversion logic
│   ├── routes/              # API endpoints (upload, convert, download, etc.)
│   ├── services/            # State management, parsers, zip handler
│   ├── tests/               # Smoke & property-based tests
│   ├── utils/               # Cleanup utilities
│   ├── validators/          # File, annotation & bbox validation
│   ├── app.py               # Flask app entry point
│   ├── Dockerfile
│   ├── gunicorn.conf.py
│   └── requirements.txt
├── cache/
│   ├── uploads/             # Mounted upload volume
│   └── outputs/             # Mounted output volume
├── frontend/                # React + Vite SPA
│   ├── src/
│   ├── public/
│   ├── nginx.conf
│   └── Dockerfile
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Quick Start

Copy the environment file:
```bash
cp .env.example .env
```

Build all images:
```bash
docker compose build
```

Start the full stack:
```bash
docker compose up -d
```

Stop the stack:
```bash
docker compose down
```

Once running, open [http://localhost](http://localhost) in your browser.

---

## Environment Variables

All configuration is driven by environment variables. See `.env.example` for a ready-to-copy template.

| Variable | Default | Description |
|---|---|---|
| `FLASK_ENV` | `production` | Flask runtime mode |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection string |
| `UPLOAD_DIR` | `/app/uploads` | Upload directory path (must exist and be writable) |
| `OUTPUT_DIR` | `/app/outputs` | Output directory path (must exist and be writable) |
| `BACKEND_URL` | `http://backend:5000` | Build arg: backend URL for nginx proxy config |

### Configuration via .env

Copy the example file and edit as needed:
```bash
cp .env.example .env
```

`docker compose up` picks up the `.env` file automatically, with values there taking precedence over Dockerfile defaults.

---

## Architecture
Browser
└─► nginx (port 80)
├─► static assets  (served directly)
└─► /api/*         (proxied to backend:5000)
└─► Flask / gunicorn
└─► Redis (shared state)

Startup order is health-gated:
- Redis must be **healthy** before the backend starts
- Backend must be **healthy** before the frontend starts

---

## Horizontal Scaling

You can run multiple backend replicas with a single flag:
```bash
docker compose up --scale backend=3
```

**Why this works:** `RedisAppState` stores ALL session state in the shared Redis service, so each backend replica is stateless with respect to application data. nginx round-robins requests across replicas using Docker's internal DNS for the `backend` service name — no load balancer configuration required.

---

## Inspecting Volume Contents

Uploaded files:
```bash
docker run --rm -v uploads_data:/data alpine ls /data
```

Converted outputs:
```bash
docker run --rm -v outputs_data:/data alpine ls /data
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Nginx |
| Backend | Python, Flask, Gunicorn |
| State | Redis |
| Container | Docker, Docker Compose |
