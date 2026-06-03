"""
Gunicorn configuration file.
post_fork runs once per worker, after the network is available,
making it the right place to connect to Redis and validate directories.
"""
import logging

bind = "0.0.0.0:5000"
workers = 2
worker_class = "sync"
timeout = 1800
keepalive = 5
loglevel = "info"
accesslog = "-"
errorlog = "-"


def post_fork(server, worker):
    """Called in each worker after the fork — network is ready here."""
    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger("gunicorn.error")
    log.info("Worker %s starting — initialising state...", worker.pid)

    import os, sys

    # Validate directories
    upload_dir = os.environ.get("UPLOAD_DIR", "/app/uploads")
    output_dir = os.environ.get("OUTPUT_DIR", "/app/outputs")
    for path in (upload_dir, output_dir):
        if not os.path.exists(path) or not os.access(path, os.W_OK):
            log.error("Directory %s does not exist or is not writable. Exiting.", path)
            sys.exit(1)

    # Initialise Redis state
    from services.state import init_state
    init_state()
