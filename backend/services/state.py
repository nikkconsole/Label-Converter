"""
services/state.py

Exports a single module-level `state` proxy object that all routes import.
The proxy delegates every attribute access to an internal backend which is
either the in-memory AppState (default, safe at import time) or a
RedisAppState (swapped in by init_state() once the network is ready).

Usage in routes:
    from services.state import state
    state.coco_data = ...          # works with both backends
    state.add_log(...)             # works with both backends

Initialisation (called from gunicorn.conf.py post_fork):
    from services.state import init_state
    init_state()
"""

import os
import sys
import time
import json
import logging
import redis as redis_module

try:
    from services.coco_parser import COCOParser
except ImportError:
    try:
        from coco_parser import COCOParser
    except ImportError:
        COCOParser = None

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# In-memory backend (default — safe to use before Redis is available)
# ---------------------------------------------------------------------------

class AppState:
    def __init__(self):
        self.uploaded_zip_path = None
        self.uploaded_json_path = None
        self.extracted_images_dir = None
        self.coco_data = None
        self.parser = None
        self.current_task_id = None

        self.validation_results = {
            "zip_valid": False,
            "zip_msg": "No ZIP file uploaded",
            "json_valid": False,
            "json_msg": "No JSON file uploaded",
            "structure_valid": False,
            "structure_errors": [],
            "stats": {
                "num_images": 0,
                "num_annotations": 0,
                "num_categories": 0,
                "categories_found": []
            },
            "bbox_validation": {
                "valid_count": 0,
                "invalid_boxes": [],
                "duplicate_boxes": [],
                "empty_annotations": []
            },
        }
        self.conversion_status = {
            "status": "idle",
            "format": None,
            "current": 0,
            "total": 0,
            "percent": 0,
            "error_msg": None,
        }
        self.conversion_result = None
        self.logs = [
            {
                "id": 1,
                "timestamp": self._get_timestamp(),
                "activity": "System Initialization",
                "status": "Success",
                "details": "Dataset Format Converter Backend started.",
            }
        ]
        self._log_id_counter = 2

    def _get_timestamp(self):
        return time.strftime("%d %b %Y, %I:%M %p")

    def add_log(self, activity, status, details):
        self.logs.insert(0, {
            "id": self._log_id_counter,
            "timestamp": self._get_timestamp(),
            "activity": activity,
            "status": status,
            "details": details,
        })
        self._log_id_counter += 1

    def clear_logs(self):
        self.logs = []
        self.add_log("Clear Logs", "Success", "User cleared activity log history.")

    def reset_dataset_state(self):
        self.uploaded_zip_path = None
        self.uploaded_json_path = None
        self.extracted_images_dir = None
        self.coco_data = None
        self.parser = None
        self.current_task_id = None
        self.validation_results = {
            "zip_valid": False,
            "zip_msg": "No ZIP file uploaded",
            "json_valid": False,
            "json_msg": "No JSON file uploaded",
            "structure_valid": False,
            "structure_errors": [],
            "stats": {"num_images": 0, "num_annotations": 0, "num_categories": 0, "categories_found": []},
            "bbox_validation": {"valid_count": 0, "invalid_boxes": [], "duplicate_boxes": [], "empty_annotations": []},
        }
        self.conversion_status = {
            "status": "idle", "format": None, "current": 0,
            "total": 0, "percent": 0, "error_msg": None,
        }
        self.conversion_result = None


# ---------------------------------------------------------------------------
# Redis backend
# ---------------------------------------------------------------------------

class RedisAppState:
    """Redis-backed state — all fields persisted under app:<field> keys."""

    _DEFAULT_VALIDATION_RESULTS = {
        "zip_valid": False, "zip_msg": "No ZIP file uploaded",
        "json_valid": False, "json_msg": "No JSON file uploaded",
        "structure_valid": False, "structure_errors": [],
        "stats": {"num_images": 0, "num_annotations": 0, "num_categories": 0, "categories_found": []},
        "bbox_validation": {"valid_count": 0, "invalid_boxes": [], "duplicate_boxes": [], "empty_annotations": []},
    }
    _DEFAULT_CONVERSION_STATUS = {
        "status": "idle", "format": None, "current": 0,
        "total": 0, "percent": 0, "error_msg": None,
    }

    def __init__(self, redis_client):
        self._redis = redis_client
        self._parser = None

    def _get(self, key, default=None):
        val = self._redis.get(key)
        return json.loads(val) if val is not None else default

    def _set(self, key, value):
        self._redis.set(key, json.dumps(value))

    @property
    def uploaded_zip_path(self):
        return self._get("app:uploaded_zip_path")
    @uploaded_zip_path.setter
    def uploaded_zip_path(self, v):
        self._set("app:uploaded_zip_path", v)

    @property
    def uploaded_json_path(self):
        return self._get("app:uploaded_json_path")
    @uploaded_json_path.setter
    def uploaded_json_path(self, v):
        self._set("app:uploaded_json_path", v)

    @property
    def extracted_images_dir(self):
        return self._get("app:extracted_images_dir")
    @extracted_images_dir.setter
    def extracted_images_dir(self, v):
        self._set("app:extracted_images_dir", v)

    @property
    def current_task_id(self):
        return self._get("app:current_task_id")
    @current_task_id.setter
    def current_task_id(self, v):
        self._set("app:current_task_id", v)

    @property
    def coco_data(self):
        return self._get("app:coco_data")
    @coco_data.setter
    def coco_data(self, v):
        self._set("app:coco_data", v)
        self._parser = None

    @property
    def validation_results(self):
        return self._get("app:validation_results", dict(self._DEFAULT_VALIDATION_RESULTS))
    @validation_results.setter
    def validation_results(self, v):
        self._set("app:validation_results", v)

    @property
    def conversion_status(self):
        return self._get("app:conversion_status", dict(self._DEFAULT_CONVERSION_STATUS))
    @conversion_status.setter
    def conversion_status(self, v):
        self._set("app:conversion_status", v)

    @property
    def conversion_result(self):
        return self._get("app:conversion_result")
    @conversion_result.setter
    def conversion_result(self, v):
        self._set("app:conversion_result", v)

    @property
    def parser(self):
        if self._parser is None and self.coco_data is not None:
            if COCOParser is not None:
                self._parser = COCOParser(data_dict=self.coco_data)
        return self._parser
    @parser.setter
    def parser(self, v):
        self._parser = v

    @property
    def logs(self):
        return [json.loads(e) for e in self._redis.lrange("app:logs", 0, -1)]

    def _get_timestamp(self):
        return time.strftime("%d %b %Y, %I:%M %p")

    def add_log(self, activity, status, details):
        entry = json.dumps({"timestamp": self._get_timestamp(),
                            "activity": activity, "status": status, "details": details})
        pipe = self._redis.pipeline()
        pipe.lpush("app:logs", entry)
        pipe.ltrim("app:logs", 0, 499)
        pipe.execute()

    def clear_logs(self):
        self._redis.delete("app:logs")
        self.add_log("Clear Logs", "Success", "User cleared activity log history.")

    def reset_dataset_state(self):
        for key in ("app:uploaded_zip_path", "app:uploaded_json_path",
                    "app:extracted_images_dir", "app:coco_data",
                    "app:validation_results", "app:conversion_status",
                    "app:conversion_result", "app:current_task_id"):
            self._redis.delete(key)
        self._parser = None


# ---------------------------------------------------------------------------
# Proxy — this is the single object imported by all routes.
# Its _backend is swapped by init_state() without changing the object identity.
# ---------------------------------------------------------------------------

class _StateProxy:
    """
    Transparent proxy around AppState or RedisAppState.
    Routes import `state` once; init_state() swaps _backend at runtime.
    """
    def __init__(self, backend):
        object.__setattr__(self, "_backend", backend)

    def __getattr__(self, name):
        return getattr(object.__getattribute__(self, "_backend"), name)

    def __setattr__(self, name, value):
        if name == "_backend":
            object.__setattr__(self, "_backend", value)
        else:
            setattr(object.__getattribute__(self, "_backend"), name, value)


# Always starts with the safe in-memory backend
state = _StateProxy(AppState())


def init_state():
    """
    Called by gunicorn post_fork (or directly in dev mode) once the
    Docker network is up and Redis is reachable.
    Swaps the proxy backend to RedisAppState if REDIS_URL is set.
    """
    redis_url = os.environ.get("REDIS_URL")
    if redis_url:
        try:
            client = redis_module.Redis.from_url(redis_url, decode_responses=True)
            client.ping()
            object.__setattr__(state, "_backend", RedisAppState(client))
            logger.info("Redis connected at %s — using RedisAppState.", redis_url)
        except Exception as exc:
            logger.error("Redis connection failed: %s. Exiting.", exc)
            sys.exit(1)
    else:
        logger.warning("REDIS_URL not set — using in-memory AppState (no horizontal scaling).")
