# Feature: docker-deployment — Frontend Dockerfile and nginx smoke tests
# Requirements: 2.1, 2.4, 2.5, 2.6, 3.1, 3.2, 3.4, 3.5, 3.6

from pathlib import Path

# Resolve paths relative to this test file:
# tests/ -> backend/ -> CODE/ -> frontend/
_FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"
_DOCKERFILE = _FRONTEND_DIR / "Dockerfile"
_NGINX_CONF = _FRONTEND_DIR / "nginx.conf"


# ---------------------------------------------------------------------------
# Frontend Dockerfile smoke tests
# ---------------------------------------------------------------------------


def test_frontend_dockerfile_exists():
    """The frontend Dockerfile must exist at CODE/frontend/Dockerfile."""
    assert _DOCKERFILE.is_file(), f"Dockerfile not found at {_DOCKERFILE}"


def test_frontend_dockerfile_multistage_build_stage():
    """Stage 1 must use node:20-alpine AS build (Requirement 2.1)."""
    content = _DOCKERFILE.read_text(encoding="utf-8")
    assert "FROM node:20-alpine AS build" in content, (
        "Expected 'FROM node:20-alpine AS build' in frontend Dockerfile"
    )


def test_frontend_dockerfile_serve_stage():
    """Stage 2 must use nginx:stable-alpine (Requirement 2.1)."""
    content = _DOCKERFILE.read_text(encoding="utf-8")
    assert "FROM nginx:stable-alpine" in content, (
        "Expected 'FROM nginx:stable-alpine' in frontend Dockerfile"
    )


def test_frontend_dockerfile_arg_backend_url():
    """ARG BACKEND_URL must be declared (Requirement 2.4)."""
    content = _DOCKERFILE.read_text(encoding="utf-8")
    assert "ARG BACKEND_URL" in content, (
        "Expected 'ARG BACKEND_URL' in frontend Dockerfile"
    )


def test_frontend_dockerfile_copy_from_build():
    """COPY --from=build must be present to copy dist artifacts (Requirement 2.5)."""
    content = _DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY --from=build" in content, (
        "Expected 'COPY --from=build' in frontend Dockerfile"
    )


def test_frontend_dockerfile_expose_80():
    """Port 80 must be exposed (Requirement 2.5)."""
    content = _DOCKERFILE.read_text(encoding="utf-8")
    assert "EXPOSE 80" in content, (
        "Expected 'EXPOSE 80' in frontend Dockerfile"
    )


# ---------------------------------------------------------------------------
# nginx.conf smoke tests
# ---------------------------------------------------------------------------


def test_nginx_conf_exists():
    """The nginx config must exist at CODE/frontend/nginx.conf."""
    assert _NGINX_CONF.is_file(), f"nginx.conf not found at {_NGINX_CONF}"


def test_nginx_conf_listen_80():
    """nginx must listen on port 80 (Requirement 3.1)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    assert "listen 80" in content, (
        "Expected 'listen 80' in nginx.conf"
    )


def test_nginx_conf_api_proxy_pass():
    """Location /api/ must have a proxy_pass directive (Requirement 3.2)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    assert "location /api/" in content, (
        "Expected 'location /api/' block in nginx.conf"
    )
    assert "proxy_pass" in content, (
        "Expected 'proxy_pass' directive inside /api/ location block in nginx.conf"
    )


def test_nginx_conf_spa_fallback():
    """try_files SPA fallback to /index.html must be present (Requirement 3.4)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    # The SPA fallback directive ends with /index.html
    assert "/index.html" in content, (
        "Expected SPA fallback '.../ /index.html' in nginx.conf try_files directive"
    )


def test_nginx_conf_cache_control_immutable():
    """Cache-Control immutable header for content-hashed assets must be present (Requirement 3.5)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    assert "immutable" in content, (
        "Expected 'immutable' in Cache-Control header for hashed assets in nginx.conf"
    )


def test_nginx_conf_no_store_for_index_html():
    """Cache-Control: no-store for index.html must be present (Requirement 3.5)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    assert "no-store" in content, (
        "Expected 'no-store' Cache-Control directive for index.html in nginx.conf"
    )


def test_nginx_conf_backend_unavailable_error_body():
    """502 JSON error body with 'Backend unavailable' must be present (Requirement 3.6)."""
    content = _NGINX_CONF.read_text(encoding="utf-8")
    assert "Backend unavailable" in content, (
        "Expected 'Backend unavailable' in the 502 error body in nginx.conf"
    )
