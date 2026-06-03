from flask import Blueprint, send_from_directory, jsonify, abort
import os
from services.state import state
from converters.coco_to_yolo import convert_coco_bbox_to_yolo
from converters.coco_to_obb import convert_coco_ann_to_obb

visualize_bp = Blueprint('visualize', __name__)

@visualize_bp.route('/images', methods=['GET'])
def list_images():
    if not state.parser:
        return jsonify({"error": "No dataset loaded"}), 400
        
    images = state.parser.get_images()
    
    # Sort images by filename or ID for predictability
    sorted_images = sorted(images, key=lambda x: x.get('file_name', ''))
    
    return jsonify({
        "images": [{
            "id": img.get('id'),
            "file_name": img.get('file_name'),
            "width": img.get('width'),
            "height": img.get('height')
        } for img in sorted_images]
    })

@visualize_bp.route('/image/<int:image_id>', methods=['GET'])
def get_image_file(image_id):
    if not state.parser or not state.extracted_images_dir:
        return jsonify({"error": "No dataset uploaded or extracted"}), 400
        
    img_info = state.parser.get_image(image_id)
    if not img_info:
        abort(404, description="Image not found in annotations")
        
    file_name = img_info.get('file_name')
    
    # Check if file exists in extracted directory
    # The file path could be nested inside extracted_images_dir
    # Search recursively for the filename in state.extracted_images_dir
    full_path = None
    for root, _, files in os.walk(state.extracted_images_dir):
        for f in files:
            if f.lower() == os.path.basename(file_name).lower():
                full_path = os.path.join(root, f)
                break
        if full_path:
            break
            
    if not full_path or not os.path.exists(full_path):
        abort(404, description="Image file not found on disk")
        
    directory = os.path.dirname(full_path)
    filename = os.path.basename(full_path)
    return send_from_directory(directory, filename)

@visualize_bp.route('/annotations/<int:image_id>', methods=['GET'])
def get_image_annotations(image_id):
    if not state.parser:
        return jsonify({"error": "No dataset loaded"}), 400
        
    img_info = state.parser.get_image(image_id)
    if not img_info:
        return jsonify({"error": "Image not found"}), 404
        
    width = img_info.get('width', 0)
    height = img_info.get('height', 0)
    
    # Read dimensions from disk if they are 0
    if (width <= 0 or height <= 0) and state.extracted_images_dir:
        file_name = img_info.get('file_name')
        for root, _, files in os.walk(state.extracted_images_dir):
            for f in files:
                if f.lower() == os.path.basename(file_name).lower():
                    try:
                        from PIL import Image
                        with Image.open(os.path.join(root, f)) as pil_img:
                            width, height = pil_img.size
                    except Exception:
                        pass
                    break
                    
    annotations = state.parser.get_annotations_for_image(image_id)
    
    annotation_details = []
    for ann in annotations:
        category_id = ann.get('category_id')
        cat_info = state.parser.categories.get(category_id, {})
        class_name = cat_info.get('name', 'Unknown')
        class_idx = state.parser.get_yolo_class_idx(category_id)
        
        bbox = ann.get('bbox')
        
        # Calculate standard normalized YOLO box
        yolo_box = None
        if bbox and len(bbox) == 4 and width > 0 and height > 0:
            yolo_box = convert_coco_bbox_to_yolo(bbox, width, height) # xc, yc, w, h
            
        # Calculate OBB
        obb_corners = None
        if width > 0 and height > 0:
            obb_corners = convert_coco_ann_to_obb(ann, width, height) # list of 4 normalized (x,y) tuples
            
        annotation_details.append({
            "annotation_id": ann.get('id'),
            "category_id": category_id,
            "class_name": class_name,
            "class_idx": class_idx,
            "bbox_coco": bbox, # [x, y, w, h] pixel coordinates
            "bbox_yolo": yolo_box, # [xc, yc, w, h] normalized
            "obb_corners": obb_corners, # [(x1,y1), (x2,y2), (x3,y3), (x4,y4)] normalized
            "segmentation": ann.get('segmentation') # Raw coco polygon
        })
        
    return jsonify({
        "image_id": image_id,
        "file_name": img_info.get('file_name'),
        "width": width,
        "height": height,
        "annotations": annotation_details
    })
