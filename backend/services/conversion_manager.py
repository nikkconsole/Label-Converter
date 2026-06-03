import os
import shutil
from converters.coco_to_yolo import coco_to_yolo_lines
from converters.coco_to_obb import coco_to_obb_lines

class ConversionManager:
    def __init__(self, outputs_base_dir):
        self.outputs_base_dir = outputs_base_dir

    def run_conversion(self, parser, target_format, output_folder_name, image_directory=None, progress_callback=None):
        """
        Runs conversion process on loaded parser.
        target_format: 'YOLO' or 'YOLO_OBB'
        output_folder_name: Subdirectory under outputs_base_dir
        image_directory: Directory containing extracted images (used to list images in train.txt)
        progress_callback: A function that accepts (current, total)
        """
        output_dir = os.path.join(self.outputs_base_dir, output_folder_name)
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        
        # We will structure output as:
        # output_dir/
        #   labels/
        #     img1.txt
        #     img2.txt
        #   obj.names
        #   obj.data
        #   train.txt
        
        labels_dir = os.path.join(output_dir, "labels")
        os.makedirs(labels_dir, exist_ok=True)
        
        images = parser.get_images()
        total_images = len(images)
        
        # Write annotation label files
        converted_count = 0
        train_lines = []
        
        for idx, img in enumerate(images):
            img_id = img.get('id')
            file_name = img.get('file_name')
            width = img.get('width', 0)
            height = img.get('height', 0)
            
            # Avoid divide by zero
            if width <= 0 or height <= 0:
                # If width/height not in JSON, try to fetch from file if image_directory provided
                if image_directory:
                    full_img_path = os.path.join(image_directory, file_name)
                    if os.path.exists(full_img_path):
                        try:
                            from PIL import Image
                            with Image.open(full_img_path) as pil_img:
                                width, height = pil_img.size
                        except Exception:
                            pass
            
            # Get annotations
            annotations = parser.get_annotations_for_image(img_id)
            
            if target_format == 'YOLO':
                lines = coco_to_yolo_lines(annotations, parser, width, height)
            elif target_format == 'YOLO_OBB':
                lines = coco_to_obb_lines(annotations, parser, width, height)
            else:
                lines = []
                
            # Write to label file (txt)
            base_name, _ = os.path.splitext(os.path.basename(file_name))
            txt_filename = f"{base_name}.txt"
            txt_path = os.path.join(labels_dir, txt_filename)
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
                
            converted_count += 1
            
            # Append image path for train.txt
            # Using relative path to images directory
            train_lines.append(f"images/{file_name}")
            
            if progress_callback:
                progress_callback(converted_count, total_images)
                
        # Write metadata support files
        class_names = parser.get_yolo_class_names()
        
        # 1. obj.names
        names_path = os.path.join(output_dir, "obj.names")
        with open(names_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(class_names))
            
        # 2. train.txt
        train_path = os.path.join(output_dir, "train.txt")
        with open(train_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(train_lines))
            
        # 3. obj.data
        data_path = os.path.join(output_dir, "obj.data")
        with open(data_path, 'w', encoding='utf-8') as f:
            data_content = (
                f"classes = {len(class_names)}\n"
                f"train = train.txt\n"
                f"names = obj.names\n"
                f"backup = backup/\n"
            )
            f.write(data_content)
            
        return {
            "output_dir": output_dir,
            "images_processed": total_images,
            "labels_generated": converted_count,
            "num_classes": len(class_names),
            "files_created": ["labels/*", "obj.names", "train.txt", "obj.data"]
        }
