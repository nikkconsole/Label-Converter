# Feature: docker-deployment — docker-compose.yml smoke tests
# Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10, 5.11

from pathlib import Path
import yaml

_COMPOSE_PATH = Path(__file__).parent.parent.parent / "docker-compose.yml"


def _load_compose():
    assert _COMPOSE_PATH.is_file(), f"docker-compose.yml not found at {_COMPOSE_PATH}"
    with _COMPOSE_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def test_compose_defines_exactly_three_services():
    # Req 5.1
    data = _load_compose()
    services = data.get("services", {})
    assert set(services.keys()) == {"redis", "backend", "frontend"}


def test_compose_named_volumes_declared():
    # Req 5.4
    data = _load_compose()
    volumes = data.get("volumes", {})
    assert "uploads_data" in volumes
    assert "outputs_data" in volumes


def test_backend_mounts_uploads_volume():
    # Req 5.2
    data = _load_compose()
    volumes = data["services"]["backend"].get("volumes", [])
    assert any("uploads_data" in str(v) and "/app/uploads" in str(v) for v in volumes)


def test_backend_mounts_outputs_volume():
    # Req 5.3
    data = _load_compose()
    volumes = data["services"]["backend"].get("volumes", [])
    assert any("outputs_data" in str(v) and "/app/outputs" in str(v) for v in volumes)


def test_backend_depends_on_redis_healthy():
    # Req 5.5
    data = _load_compose()
    depends = data["services"]["backend"].get("depends_on", {})
    assert depends.get("redis", {}).get("condition") == "service_healthy"


def test_frontend_depends_on_backend_healthy():
    # Req 5.6
    data = _load_compose()
    depends = data["services"]["frontend"].get("depends_on", {})
    assert depends.get("backend", {}).get("condition") == "service_healthy"


def test_redis_healthcheck():
    # Req 5.7
    data = _load_compose()
    hc = data["services"]["redis"].get("healthcheck", {})
    assert hc.get("test") == ["CMD", "redis-cli", "ping"]
    assert hc.get("interval") == "10s"
    assert hc.get("timeout") == "5s"
    assert hc.get("retries") == 5
    assert hc.get("start_period") == "5s"


def test_backend_healthcheck():
    # Req 5.8
    data = _load_compose()
    hc = data["services"]["backend"].get("healthcheck", {})
    assert "curl" in str(hc.get("test", []))
    assert "http://localhost:5000/api/health" in str(hc.get("test", []))
    assert hc.get("interval") == "15s"
    assert hc.get("timeout") == "5s"
    assert hc.get("retries") == 3
    assert hc.get("start_period") == "10s"


def test_backend_has_no_static_port_binding():
    # Req 5.10 — backend must not have a static ports binding to allow --scale
    data = _load_compose()
    ports = data["services"]["backend"].get("ports", [])
    assert len(ports) == 0, f"backend must not have static port bindings, got: {ports}"


def test_frontend_exposes_port_80():
    # Req 5.11
    data = _load_compose()
    ports = data["services"]["frontend"].get("ports", [])
    assert any("80" in str(p) for p in ports), f"Expected port 80 in frontend ports, got: {ports}"
