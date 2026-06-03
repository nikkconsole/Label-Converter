from flask import Blueprint, jsonify
from services.state import state

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('', methods=['GET'])
def get_logs():
    return jsonify({
        "logs": state.logs
    })

@logs_bp.route('/clear', methods=['POST'])
def clear_logs():
    state.clear_logs()
    return jsonify({
        "message": "Logs cleared successfully.",
        "logs": state.logs
    })
