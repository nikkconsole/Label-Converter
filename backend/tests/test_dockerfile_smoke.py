# Feature: docker-deployment — Backend Dockerfile smoke test
# Requirements: 1.1, 1.2, 1.5, 1.6, 6.2

from pathlib import Path
import re

# Navigate 2 levels up from tests/ to reach CODE/backend/, then read Dockerfile
DOCKERFILE_PATH = Path(__file__).parent.parent / "Dockerfile"


def _read_dockerfile() -> str:
    assert DOCKERFILE_PATH.exists(), f"Dockerfile not found at {DOCKERFILE_PATH}"
    return DOCKERFILE_PATH.read_text(encoding="utf-8")


def test_base_image_pinned_to_python_311_slim():
    """Requirement 1.1 — base image must be python:3.11-slim (not a floating tag)."""
    content = _read_dockerfile()
    assert "FROM python:3.11-slim" in content, (
        "Dockerfile must use 'FROM python:3.11-slim' as the base image"
    )


def test_pip_install_uses_no_cache_dir():
    """Requirement 1.2 — pip install must use --no-cache-dir to keep the image layer small."""
    content = _read_dockerfile()
    # Verify --no-cache-dir appears inside a RUN instruction
    run_lines = [line for line in content.splitlines() if re.match(r"^\s*RUN\b", line)]
    assert run_lines, "No RUN instructions found in Dockerfile"
    run_block = "\n".join(run_lines)
    assert "--no-cache-dir" in run_block, (
        "'--no-cache-dir' must appear in a RUN instruction for pip"
    )


def test_cmd_uses_gunicorn():
    """Requirement 1.7 — CMD must launch gunicorn as the WSGI server."""
    content = _read_dockerfile()
    cmd_lines = [line for line in content.splitlines() if re.match(r"^\s*CMD\b", line)]
    assert cmd_lines, "No CMD instruction found in Dockerfile"
    cmd_block = "\n".join(cmd_lines)
    assert "gunicorn" in cmd_block, (
        "'gunicorn' must appear in the CMD instruction"
    )


def test_expose_5000():
    """Requirement 1.5 — port 5000 must be exposed."""
    content = _read_dockerfile()
    assert "EXPOSE 5000" in content, (
        "Dockerfile must contain 'EXPOSE 5000'"
    )


def test_env_flask_env_declared():
    """Requirement 1.6 — ENV FLASK_ENV must be declared."""
    content = _read_dockerfile()
    assert re.search(r"^\s*ENV\s+FLASK_ENV", content, re.MULTILINE), (
        "Dockerfile must declare 'ENV FLASK_ENV'"
    )


def test_env_redis_url_declared():
    """Requirement 1.6 — ENV REDIS_URL must be declared."""
    content = _read_dockerfile()
    assert re.search(r"^\s*ENV\s+REDIS_URL", content, re.MULTILINE), (
        "Dockerfile must declare 'ENV REDIS_URL'"
    )


def test_env_upload_dir_declared():
    """Requirement 6.2 / 6.4 — ENV UPLOAD_DIR must be declared."""
    content = _read_dockerfile()
    assert re.search(r"^\s*ENV\s+UPLOAD_DIR", content, re.MULTILINE), (
        "Dockerfile must declare 'ENV UPLOAD_DIR'"
    )


def test_env_output_dir_declared():
    """Requirement 6.2 / 6.5 — ENV OUTPUT_DIR must be declared."""
    content = _read_dockerfile()
    assert re.search(r"^\s*ENV\s+OUTPUT_DIR", content, re.MULTILINE), (
        "Dockerfile must declare 'ENV OUTPUT_DIR'"
    )
