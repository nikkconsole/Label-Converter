def validate_coco_structure(coco_data):
    """
    Validates that the provided coco_data has standard COCO JSON structure:
    - Must contain 'images', 'annotations', 'categories'
    - These must be list types
    - Categories must have 'id' and 'name'
    - Images must have 'id' and 'file_name'
    - Annotations must have 'id', 'image_id', 'category_id', and 'bbox' (list of 4 float/int)
    Returns (is_valid, errors, stats)
    """
    errors = []
    stats = {
        "num_images": 0,
        "num_annotations": 0,
        "num_categories": 0,
        "categories_found": []
    }
    
    if not isinstance(coco_data, dict):
        return False, ["COCO root element must be a JSON object (dictionary)."], stats
    
    # 1. Check required keys
    required_keys = ['images', 'annotations', 'categories']
    for key in required_keys:
        if key not in coco_data:
            errors.append(f"Missing required top-level key: '{key}'")
        elif not isinstance(coco_data[key], list):
            errors.append(f"Top-level key '{key}' must be a list (array).")
            
    if errors:
        return False, errors, stats
        
    images = coco_data['images']
    annotations = coco_data['annotations']
    categories = coco_data['categories']
    
    stats["num_images"] = len(images)
    stats["num_annotations"] = len(annotations)
    stats["num_categories"] = len(categories)
    
    # 2. Validate categories
    category_ids = set()
    for idx, cat in enumerate(categories):
        if not isinstance(cat, dict):
            errors.append(f"Category at index {idx} is not a JSON object.")
            continue
        if 'id' not in cat or 'name' not in cat:
            errors.append(f"Category at index {idx} must have 'id' and 'name'.")
            continue
        category_ids.add(cat['id'])
        stats["categories_found"].append({"id": cat['id'], "name": cat['name']})
        
    # 3. Validate images
    image_ids = set()
    for idx, img in enumerate(images):
        if not isinstance(img, dict):
            errors.append(f"Image at index {idx} is not a JSON object.")
            continue
        if 'id' not in img or 'file_name' not in img:
            errors.append(f"Image at index {idx} must have 'id' and 'file_name'.")
            continue
        image_ids.add(img['id'])
        
    # 4. Check for invalid references in annotations
    for idx, ann in enumerate(annotations):
        if not isinstance(ann, dict):
            errors.append(f"Annotation at index {idx} is not a JSON object.")
            continue
        
        ann_id = ann.get('id', f"index {idx}")
        
        # Check keys
        required_ann_keys = ['id', 'image_id', 'category_id', 'bbox']
        missing_ann_keys = [k for k in required_ann_keys if k not in ann]
        if missing_ann_keys:
            errors.append(f"Annotation {ann_id} is missing keys: {', '.join(missing_ann_keys)}")
            continue
            
        # Check references
        if ann['image_id'] not in image_ids:
            errors.append(f"Annotation {ann_id} references non-existent image_id: {ann['image_id']}")
        if ann['category_id'] not in category_ids:
            errors.append(f"Annotation {ann_id} references non-existent category_id: {ann['category_id']}")
            
        bbox = ann['bbox']
        if not isinstance(bbox, list) or len(bbox) != 4:
            errors.append(f"Annotation {ann_id} bounding box 'bbox' must be a list of 4 values.")
            
    is_valid = len(errors) == 0
    return is_valid, errors, stats
