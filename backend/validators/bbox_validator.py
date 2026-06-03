def validate_bounding_boxes(coco_data):
    """
    Validates bounding boxes inside coco_data:
    - Finds valid annotations
    - Finds invalid bounding boxes (negative width/height, area <= 0)
    - Finds duplicate annotations (same image, category, and bbox)
    - Finds empty annotations
    Returns a summary dict with detail lists.
    """
    annotations = coco_data.get('annotations', [])
    images = {img['id']: img for img in coco_data.get('images', [])}
    
    valid_count = 0
    invalid_boxes = []
    duplicate_boxes = []
    empty_annotations = []
    
    seen_annotations = set() # (image_id, category_id, tuple(bbox))
    
    for idx, ann in enumerate(annotations):
        ann_id = ann.get('id', idx)
        image_id = ann.get('image_id')
        category_id = ann.get('category_id')
        bbox = ann.get('bbox')
        
        # 1. Empty/Missing bbox
        if bbox is None or not isinstance(bbox, list):
            empty_annotations.append({
                "annotation_id": ann_id,
                "image_id": image_id,
                "reason": "Missing bounding box list"
            })
            continue
            
        if len(bbox) == 0:
            empty_annotations.append({
                "annotation_id": ann_id,
                "image_id": image_id,
                "reason": "Empty bounding box list"
            })
            continue
            
        if len(bbox) != 4:
            invalid_boxes.append({
                "annotation_id": ann_id,
                "image_id": image_id,
                "bbox": bbox,
                "reason": f"Expected 4 values, got {len(bbox)}"
            })
            continue
            
        x, y, w, h = bbox
        
        # 2. Invalid Dimensions (w <= 0, h <= 0)
        if w <= 0 or h <= 0:
            invalid_boxes.append({
                "annotation_id": ann_id,
                "image_id": image_id,
                "bbox": bbox,
                "reason": f"Negative or zero dimensions: width={w}, height={h}"
            })
            continue
            
        # 3. Check out of boundary if image size is available
        img_info = images.get(image_id)
        if img_info:
            img_w = img_info.get('width')
            img_h = img_info.get('height')
            if img_w and img_h:
                # Check if it is completely out
                if x >= img_w or y >= img_h or (x + w) <= 0 or (y + h) <= 0:
                    invalid_boxes.append({
                        "annotation_id": ann_id,
                        "image_id": image_id,
                        "bbox": bbox,
                        "reason": f"Bounding box completely outside image boundaries ({img_w}x{img_h})"
                    })
                    continue
                    
        # 4. Check for duplicates
        bbox_tuple = (round(x, 4), round(y, 4), round(w, 4), round(h, 4))
        ann_sig = (image_id, category_id, bbox_tuple)
        if ann_sig in seen_annotations:
            duplicate_boxes.append({
                "annotation_id": ann_id,
                "image_id": image_id,
                "bbox": bbox,
                "reason": "Duplicate bounding box for the same image and category"
            })
            continue
            
        seen_annotations.add(ann_sig)
        valid_count += 1
        
    return {
        "valid_count": valid_count,
        "invalid_boxes": invalid_boxes,
        "duplicate_boxes": duplicate_boxes,
        "empty_annotations": empty_annotations
    }
