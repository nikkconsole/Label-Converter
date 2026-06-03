def convert_coco_bbox_to_yolo(bbox, img_width, img_height):
    """
    Converts COCO bbox [x_min, y_min, width, height] to YOLO [x_center, y_center, width, height] normalized.
    """
    x_min, y_min, w, h = bbox
    
    # Avoid division by zero
    if img_width <= 0 or img_height <= 0:
        return 0.0, 0.0, 0.0, 0.0
        
    x_center = x_min + w / 2.0
    y_center = y_min + h / 2.0
    
    x_center_norm = x_center / img_width
    y_center_norm = y_center / img_height
    w_norm = w / img_width
    h_norm = h / img_height
    
    # Clip to bounds [0.0, 1.0]
    x_center_norm = max(0.0, min(1.0, x_center_norm))
    y_center_norm = max(0.0, min(1.0, y_center_norm))
    w_norm = max(0.0, min(1.0, w_norm))
    h_norm = max(0.0, min(1.0, h_norm))
    
    return x_center_norm, y_center_norm, w_norm, h_norm

def coco_to_yolo_lines(annotations, parser, img_width, img_height):
    """
    Converts list of COCO annotations for a single image into YOLO text lines.
    """
    lines = []
    for ann in annotations:
        category_id = ann.get('category_id')
        bbox = ann.get('bbox')
        
        if not bbox or len(bbox) != 4:
            continue
            
        class_idx = parser.get_yolo_class_idx(category_id)
        if class_idx is None:
            continue # Category not in categories list
            
        x_c, y_c, w, h = convert_coco_bbox_to_yolo(bbox, img_width, img_height)
        lines.append(f"{class_idx} {x_c:.6f} {y_c:.6f} {w:.6f} {h:.6f}")
        
    return lines
