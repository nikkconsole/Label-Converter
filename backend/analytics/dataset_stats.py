import os
import time

def get_directory_size(directory):
    """Calculates total size in bytes of files in directory."""
    if not os.path.exists(directory):
        return 0
    total_size = 0
    for root, _, files in os.walk(directory):
        for f in files:
            fp = os.path.join(root, f)
            if os.path.exists(fp):
                total_size += os.path.getsize(fp)
    return total_size

def compute_dataset_stats(coco_data, json_path, images_dir):
    """
    Computes overall stats for the uploaded dataset.
    """
    images = coco_data.get('images', [])
    annotations = coco_data.get('annotations', [])
    categories = coco_data.get('categories', [])
    
    total_images = len(images)
    total_annotations = len(annotations)
    total_classes = len(categories)
    
    # Dataset size calculation: json size + extracted images size
    json_size = os.path.getsize(json_path) if json_path and os.path.exists(json_path) else 0
    images_size = get_directory_size(images_dir) if images_dir else 0
    total_size_bytes = json_size + images_size
    
    # Format size (e.g. 3.45 GB or 245 MB)
    if total_size_bytes >= 1024**3:
        formatted_size = f"{total_size_bytes / (1024**3):.2f} GB"
    elif total_size_bytes >= 1024**2:
        formatted_size = f"{total_size_bytes / (1024**2):.2f} MB"
    else:
        formatted_size = f"{total_size_bytes / 1024:.2f} KB"
        
    # Created Date (use current time or JSON file modification time)
    created_time_str = time.strftime("%d %b %Y, %I:%M %p", time.localtime())
    if json_path and os.path.exists(json_path):
        mtime = os.path.getmtime(json_path)
        created_time_str = time.strftime("%d %b %Y, %I:%M %p", time.localtime(mtime))
        
    return {
        "total_images": total_images,
        "total_annotations": total_annotations,
        "total_classes": total_classes,
        "dataset_size": formatted_size,
        "created_at": created_time_str,
        "json_filename": os.path.basename(json_path) if json_path else "annotations.json",
        "images_folder": os.path.basename(images_dir) if images_dir else "images/"
    }
