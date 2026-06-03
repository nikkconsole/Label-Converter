from flask import Blueprint, send_file, jsonify, request
import os
import zipfile
import tempfile
from services.state import state

download_bp = Blueprint('download', __name__)

@download_bp.route('/dataset', methods=['GET'])
def download_dataset():
    if not state.conversion_result:
        return jsonify({"error": "No conversion result available. Please run conversion first."}), 400
        
    output_dir = state.conversion_result.get("output_dir")
    target_format = state.conversion_result.get("target_format")
    
    if not output_dir or not os.path.exists(output_dir):
        return jsonify({"error": "Converted dataset directory not found."}), 404
        
    include_images = request.args.get('include_images', 'true').lower() == 'true'
    
    try:
        # Create zip in a temporary file
        temp_dir = tempfile.gettempdir()
        zip_filename = f"converted_dataset_{target_format.lower()}.zip"
        if not include_images:
            zip_filename = f"converted_annotations_{target_format.lower()}.zip"
            
        zip_path = os.path.join(temp_dir, zip_filename)
        
        # If zip exists, remove it
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            # 1. Add output_dir contents (labels/, obj.names, obj.data, train.txt)
            for root, _, files in os.walk(output_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, output_dir)
                    zip_ref.write(full_path, arcname=rel_path)
                    
            # 2. Add source images under images/ if they are available
            if include_images and state.extracted_images_dir and os.path.exists(state.extracted_images_dir):
                for root, _, files in os.walk(state.extracted_images_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        # We want images to be in an "images" directory in the zip
                        rel_path = os.path.relpath(full_path, state.extracted_images_dir)
                        zip_ref.write(full_path, arcname=os.path.join("images", rel_path))
                        
        state.add_log("Download Dataset", "Success", f"Downloaded converted dataset: {zip_filename}.")
        
        return send_file(
            zip_path,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_filename
        )
    except Exception as e:
        state.add_log("Download Dataset Failed", "Error", str(e))
        return jsonify({"error": f"Failed to build download archive: {str(e)}"}), 500
