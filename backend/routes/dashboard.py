from flask import Blueprint, jsonify
from services.state import state
from services.zip_handler import ZipHandler
from analytics.dataset_stats import compute_dataset_stats
from analytics.class_distribution import compute_class_distribution

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    if not state.coco_data:
        return jsonify({"error": "No dataset loaded. Please upload ZIP and JSON files first."}), 400
        
    # Calculate statistics
    stats = compute_dataset_stats(state.coco_data, state.uploaded_json_path, state.extracted_images_dir)
    
    # Calculate class distribution
    class_dist = compute_class_distribution(state.coco_data)
    
    # Check matching images from ZIP
    missing_images_count = 0
    missing_images_list = []
    
    if state.extracted_images_dir:
        coco_filenames = [img['file_name'] for img in state.coco_data.get('images', [])]
        handler = ZipHandler("")
        found, missing_images_list = handler.verify_images_match(state.extracted_images_dir, coco_filenames)
        missing_images_count = len(missing_images_list)
        
    bbox_val = state.validation_results["bbox_validation"]
    
    valid_images_count = stats["total_images"] - missing_images_count
    
    # Validation results breakdown
    validation_results = {
        "valid_images": valid_images_count,
        "missing_images": missing_images_count,
        "missing_images_list": missing_images_list[:100], # Cap it
        "invalid_boxes": len(bbox_val.get("invalid_boxes", [])),
        "empty_annotations": len(bbox_val.get("empty_annotations", [])),
        "duplicate_annotations": len(bbox_val.get("duplicate_boxes", []))
    }
    
    return jsonify({
        "stats": stats,
        "class_distribution": class_dist,
        "validation_results": validation_results
    })
