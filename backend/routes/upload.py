from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename
from services.state import state
from services.zip_handler import ZipHandler
from services.coco_parser import COCOParser
from validators.file_validator import validate_zip_file, validate_json_file
from validators.annotation_validator import validate_coco_structure
from validators.bbox_validator import validate_bounding_boxes
from utils.cleanup import cleanup_old_tasks
import datetime

upload_bp = Blueprint('upload', __name__)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads')))
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _set_vr(**kwargs):
    """Read-modify-write validation_results so Redis gets the updated dict."""
    vr = state.validation_results
    vr.update(kwargs)
    state.validation_results = vr


@upload_bp.route('/zip', methods=['POST'])
def upload_zip():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        filename = secure_filename(file.filename)
        
        # Start a new task session on ZIP upload
        state.current_task_id = f"task_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        task_upload_dir = os.path.join(UPLOAD_DIR, state.current_task_id)
        os.makedirs(task_upload_dir, exist_ok=True)
        
        file_path = os.path.join(task_upload_dir, filename)
        file.save(file_path)

        is_valid, msg = validate_zip_file(file_path)
        _set_vr(zip_valid=is_valid, zip_msg=msg)

        if is_valid:
            state.uploaded_zip_path = file_path
            handler = ZipHandler(task_upload_dir)
            extracted_dir = handler.extract_zip(file_path, "extracted_images")
            state.extracted_images_dir = extracted_dir
            state.add_log("ZIP Upload & Extract", "Success", f"Extracted {filename} successfully.")
        else:
            state.add_log("ZIP Upload Failed", "Error", msg)
            return jsonify({"error": msg}), 400

        cleanup_old_tasks(UPLOAD_DIR, max_tasks=2)

        return jsonify({"message": "ZIP file uploaded and extracted successfully.", "details": msg})

    except Exception as e:
        state.add_log("ZIP Upload Error", "Error", str(e))
        return jsonify({"error": f"Failed to upload ZIP: {str(e)}"}), 500


@upload_bp.route('/json', methods=['POST'])
def upload_json():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        filename = secure_filename(file.filename)
        
        if not state.current_task_id:
            state.current_task_id = f"task_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
        task_upload_dir = os.path.join(UPLOAD_DIR, state.current_task_id)
        os.makedirs(task_upload_dir, exist_ok=True)
        
        file_path = os.path.join(task_upload_dir, filename)
        file.save(file_path)

        is_valid_json, msg_json, parsed_data = validate_json_file(file_path)
        _set_vr(json_valid=is_valid_json, json_msg=msg_json)

        if not is_valid_json:
            state.add_log("JSON Upload Failed", "Error", msg_json)
            return jsonify({"error": msg_json}), 400

        is_struct_valid, struct_errors, stats = validate_coco_structure(parsed_data)
        _set_vr(structure_valid=is_struct_valid,
                structure_errors=struct_errors,
                stats=stats)

        bbox_results = validate_bounding_boxes(parsed_data)
        _set_vr(bbox_validation=bbox_results)

        state.uploaded_json_path = file_path
        state.coco_data = parsed_data
        state.parser = COCOParser(data_dict=parsed_data)

        state.add_log("JSON Upload & Validate", "Success",
                      f"Validated {filename}. {stats['num_images']} images, {stats['num_annotations']} annotations.")

        cleanup_old_tasks(UPLOAD_DIR, max_tasks=2)

        return jsonify({
            "message": "JSON file uploaded and validated successfully.",
            "stats": stats,
            "bbox_validation": bbox_results
        })

    except Exception as e:
        state.add_log("JSON Upload Error", "Error", str(e))
        return jsonify({"error": f"Failed to upload JSON: {str(e)}"}), 500


@upload_bp.route('/status', methods=['GET'])
def get_status():
    return jsonify(state.validation_results)


@upload_bp.route('/reset', methods=['POST'])
def reset_state():
    state.reset_dataset_state()
    state.add_log("Reset Dataset", "Success", "Cleared active dataset from session state.")
    return jsonify({"message": "State reset successfully."})
