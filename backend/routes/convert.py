from flask import Blueprint, request, jsonify
import os
import threading
from services.state import state
from services.conversion_manager import ConversionManager
from utils.cleanup import cleanup_old_tasks

convert_bp = Blueprint('convert', __name__)

OUTPUTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'outputs'))
os.makedirs(OUTPUTS_DIR, exist_ok=True)


def _set_cs(**kwargs):
    """Read-modify-write conversion_status so Redis gets the updated dict."""
    cs = state.conversion_status
    cs.update(kwargs)
    state.conversion_status = cs


def run_conversion_thread(target_format, generate_data_files, folder_name):
    try:
        manager = ConversionManager(OUTPUTS_DIR)

        def progress_callback(current, total):
            _set_cs(current=current, total=total,
                    percent=int((current / total) * 100) if total > 0 else 0)

        _set_cs(status="converting", format=target_format, current=0, percent=0)

        result = manager.run_conversion(
            parser=state.parser,
            target_format=target_format,
            output_folder_name=folder_name,
            image_directory=state.extracted_images_dir,
            progress_callback=progress_callback
        )

        from analytics.dataset_stats import get_directory_size
        output_path = os.path.join(OUTPUTS_DIR, folder_name)
        total_size_bytes = get_directory_size(output_path)
        formatted_size = (f"{total_size_bytes / (1024**2):.2f} MB"
                          if total_size_bytes >= 1024**2
                          else f"{total_size_bytes / 1024:.2f} KB")

        result["output_size"] = formatted_size
        result["target_format"] = target_format

        state.conversion_result = result
        _set_cs(status="completed")
        state.add_log("Convert Dataset", "Success",
                      f"Converted dataset to {target_format} format successfully. Size: {formatted_size}.")
                      
        cleanup_old_tasks(OUTPUTS_DIR, max_tasks=2)

    except Exception as e:
        _set_cs(status="failed", error_msg=str(e))
        state.add_log("Convert Dataset Failed", "Error", str(e))


@convert_bp.route('/start', methods=['POST'])
def start_conversion():
    if not state.parser:
        return jsonify({"error": "No dataset loaded. Please upload ZIP and JSON files first."}), 400

    if state.conversion_status["status"] == "converting":
        return jsonify({"error": "A conversion is already running."}), 400

    data = request.get_json() or {}
    target_format = data.get('format', 'YOLO')
    generate_data_files = data.get('generate_data_files', True)

    if target_format not in ['YOLO', 'YOLO_OBB']:
        return jsonify({"error": "Invalid format specified. Must be 'YOLO' or 'YOLO_OBB'."}), 400

    folder_name = state.current_task_id if state.current_task_id else "default_task"

    t = threading.Thread(
        target=run_conversion_thread,
        args=(target_format, generate_data_files, folder_name)
    )
    t.daemon = True
    t.start()

    state.add_log("Convert Dataset Initiated", "Success",
                  f"Started background conversion to {target_format}.")

    return jsonify({"message": "Conversion started in background.", "status": "converting"})


@convert_bp.route('/status', methods=['GET'])
def get_conversion_status():
    return jsonify({"status": state.conversion_status, "result": state.conversion_result})
