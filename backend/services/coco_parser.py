import json
import os

class COCOParser:
    def __init__(self, json_path=None, data_dict=None):
        self.json_path = json_path
        self.data = data_dict
        
        self.images = {}       # image_id -> image_dict
        self.annotations = {}  # image_id -> list of annotation_dicts
        self.categories = {}   # category_id -> category_dict
        self.category_mapping = {} # category_id -> sequential_idx (0 to C-1)
        
        if json_path:
            self.load_file(json_path)
        elif data_dict:
            self.load_data(data_dict)

    def load_file(self, json_path):
        if not os.path.exists(json_path):
            raise FileNotFoundError(f"JSON file not found at {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        self.load_data(self.data)

    def load_data(self, data):
        self.data = data
        self.images = {img['id']: img for img in data.get('images', [])}
        self.categories = {cat['id']: cat for cat in data.get('categories', [])}
        
        # Build category sequential index (0-based) for YOLO
        # Sort by category ID to keep it deterministic
        sorted_cat_ids = sorted(self.categories.keys())
        self.category_mapping = {cat_id: idx for idx, cat_id in enumerate(sorted_cat_ids)}
        
        # Build annotations map index
        self.annotations = {}
        for ann in data.get('annotations', []):
            img_id = ann.get('image_id')
            if img_id not in self.annotations:
                self.annotations[img_id] = []
            self.annotations[img_id].append(ann)

    def get_images(self):
        return list(self.images.values())

    def get_image(self, img_id):
        return self.images.get(img_id)

    def get_annotations_for_image(self, img_id):
        return self.annotations.get(img_id, [])

    def get_categories(self):
        return list(self.categories.values())

    def get_yolo_class_names(self):
        # Returns list of class names ordered by sequential index
        sorted_mapping = sorted(self.category_mapping.items(), key=lambda x: x[1])
        return [self.categories[cat_id]['name'] for cat_id, _ in sorted_mapping]

    def get_yolo_class_idx(self, category_id):
        return self.category_mapping.get(category_id)
