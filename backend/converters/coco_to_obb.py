import math

def rotate_point(x, y, angle_rad):
    """Rotates a point (x, y) by angle_rad around the origin."""
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    return x * cos_a - y * sin_a, x * sin_a + y * cos_a

def find_min_area_rect(points):
    """
    Finds the minimum area bounding box for a set of 2D points.
    Returns the 4 corner points of the rectangle: [(x1, y1), (x2, y2), (x3, y3), (x4, y4)].
    """
    if len(points) < 3:
        # Fallback if too few points (e.g. just a line or single point)
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        return [
            (min_x, min_y),
            (max_x, min_y),
            (max_x, max_y),
            (min_x, max_y)
        ]
        
    best_area = float('inf')
    best_corners = []
    
    # Try angles from 0 to 90 degrees in steps of 5 degrees
    # For sub-pixel accuracy, 5-degree steps are generally fine, but we can do 3-degree steps
    for angle_deg in range(0, 90, 3):
        angle_rad = math.radians(angle_deg)
        
        # Rotate points to align with axis
        rotated_points = [rotate_point(p[0], p[1], -angle_rad) for p in points]
        
        # Find AABB in rotated frame
        xs = [p[0] for p in rotated_points]
        ys = [p[1] for p in rotated_points]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        area = (max_x - min_x) * (max_y - min_y)
        
        if area < best_area:
            best_area = area
            # Define 4 corners in rotated space
            r_corners = [
                (min_x, min_y),
                (max_x, min_y),
                (max_x, max_y),
                (min_x, max_y)
            ]
            # Rotate corners back to original space
            best_corners = [rotate_point(c[0], c[1], angle_rad) for c in r_corners]
            
    return best_corners

def convert_coco_ann_to_obb(ann, img_width, img_height):
    """
    Extracts the 4 normalized corners of the oriented bounding box.
    Returns: [(x1, y1), (x2, y2), (x3, y3), (x4, y4)] normalized or None.
    """
    if img_width <= 0 or img_height <= 0:
        return None
        
    segmentation = ann.get('segmentation')
    bbox = ann.get('bbox')
    
    points = []
    
    # 1. Parse segmentation if it exists and is not empty
    if segmentation and isinstance(segmentation, list):
        for poly in segmentation:
            if isinstance(poly, list) and len(poly) >= 6:
                # poly is [x1, y1, x2, y2, ...]
                for i in range(0, len(poly) - 1, 2):
                    points.append((poly[i], poly[i+1]))
                    
    # 2. If we found enough points, compute min area rect
    if len(points) >= 3:
        corners = find_min_area_rect(points)
    elif bbox and len(bbox) == 4:
        # Fallback to axis-aligned bounding box corners
        x, y, w, h = bbox
        corners = [
            (x, y),
            (x + w, y),
            (x + w, y + h),
            (x, y + h)
        ]
    else:
        return None
        
    # Normalize coordinates and clip to [0.0, 1.0]
    normalized_corners = []
    for cx, cy in corners:
        nx = max(0.0, min(1.0, cx / img_width))
        ny = max(0.0, min(1.0, cy / img_height))
        normalized_corners.append((nx, ny))
        
    return normalized_corners

def coco_to_obb_lines(annotations, parser, img_width, img_height):
    """
    Converts list of COCO annotations for a single image into YOLO OBB text lines.
    Format: class_idx x1 y1 x2 y2 x3 y3 x4 y4
    """
    lines = []
    for ann in annotations:
        category_id = ann.get('category_id')
        class_idx = parser.get_yolo_class_idx(category_id)
        if class_idx is None:
            continue
            
        obb_corners = convert_coco_ann_to_obb(ann, img_width, img_height)
        if not obb_corners or len(obb_corners) != 4:
            continue
            
        x1, y1 = obb_corners[0]
        x2, y2 = obb_corners[1]
        x3, y3 = obb_corners[2]
        x4, y4 = obb_corners[3]
        
        lines.append(f"{class_idx} {x1:.6f} {y1:.6f} {x2:.6f} {y2:.6f} {x3:.6f} {y3:.6f} {x4:.6f} {y4:.6f}")
        
    return lines
