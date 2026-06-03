def compute_class_distribution(coco_data):
    """
    Computes class distribution counts for categories.
    Returns a list of dicts: [{"name": class_name, "count": count, "id": cat_id}]
    """
    categories = coco_data.get('categories', [])
    annotations = coco_data.get('annotations', [])
    
    # Map category ID to name
    cat_map = {cat['id']: cat['name'] for cat in categories}
    
    # Initialize counts
    counts = {cat_id: 0 for cat_id in cat_map.keys()}
    
    for ann in annotations:
        cat_id = ann.get('category_id')
        if cat_id in counts:
            counts[cat_id] += 1
            
    # Compile distribution list
    distribution = []
    for cat_id, count in counts.items():
        distribution.append({
            "id": cat_id,
            "name": cat_map[cat_id],
            "count": count
        })
        
    # Sort by count descending
    distribution.sort(key=lambda x: x['count'], reverse=True)
    return distribution
