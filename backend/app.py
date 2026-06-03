import logging
import os
import sys

from flask import Flask, jsonify
from routes.upload import upload_bp
from routes.dashboard import dashboard_bp
from routes.convert import convert_bp
from routes.visualize import visualize_bp
from routes.download import download_bp
from routes.logs import logs_bp

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Register blueprints
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(convert_bp, url_prefix='/api/convert')
app.register_blueprint(visualize_bp, url_prefix='/api/visualize')
app.register_blueprint(download_bp, url_prefix='/api/download')
app.register_blueprint(logs_bp, url_prefix='/api/logs')


# Global CORS handling
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Dataset Format Converter Backend"
    })


if __name__ == '__main__':
    # Local dev — init state directly (no gunicorn post_fork)
    from services.state import init_state
    upload_dir = os.environ.get("UPLOAD_DIR", "/app/uploads")
    output_dir = os.environ.get("OUTPUT_DIR", "/app/outputs")
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    init_state()
    print("Starting Dataset Format Converter Flask Backend...")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
