import zipfile
import os
import shutil

class ZipHandler:
    def __init__(self, extract_base_dir):
        self.extract_base_dir = extract_base_dir

    def extract_zip(self, zip_path, folder_name):
        """
        Extracts ZIP file to a target subdirectory under extract_base_dir.
        Returns the path to the directory containing the actual images.
        """
        target_dir = os.path.join(self.extract_base_dir, folder_name)
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
        os.makedirs(target_dir, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(target_dir)

        # Detect nested folder structure
        # If the zip has a single root directory that contains everything, locate it
        actual_img_dir = self._find_image_directory(target_dir)
        return actual_img_dir

    def _find_image_directory(self, target_dir):
        """
        Locates the directory that actually contains the image files.
        Checks recursively up to 3 levels down.
        """
        image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff')
        
        # Walk through the directories and count image files
        dir_image_counts = {}
        for root, dirs, files in os.walk(target_dir):
            img_count = sum(1 for f in files if f.lower().endswith(image_extensions))
            if img_count > 0:
                dir_image_counts[root] = img_count

        if not dir_image_counts:
            # If no images, return target_dir
            return target_dir

        # Return the directory with the most images
        best_dir = max(dir_image_counts, key=dir_image_counts.get)
        return best_dir

    def verify_images_match(self, image_directory, coco_filenames):
        """
        Checks how many COCO image filenames exist in the extracted image directory.
        Returns (num_found, missing_list)
        """
        missing_list = []
        found_count = 0
        
        # Scan extracted files
        available_files = {}
        for root, _, files in os.walk(image_directory):
            for f in files:
                available_files[f.lower()] = os.path.join(root, f)

        for name in coco_filenames:
            basename = os.path.basename(name).lower()
            if basename in available_files:
                found_count += 1
            else:
                missing_list.append(name)
                
        return found_count, missing_list

    def clean_directory(self, dir_path):
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
