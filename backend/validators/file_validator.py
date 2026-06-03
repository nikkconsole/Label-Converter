import zipfile
import json
import os

def validate_zip_file(file_path):
    """
    Validates if the file at file_path is a valid zip archive.
    Returns (is_valid, message)
    """
    if not os.path.exists(file_path):
        return False, "File does not exist."
    
    if not zipfile.is_zipfile(file_path):
        return False, "The file is not a valid ZIP archive."
    
    try:
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            # Check if it contains images
            file_list = zip_ref.namelist()
            image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff')
            has_images = any(f.lower().endswith(image_extensions) for f in file_list)
            if not has_images:
                return False, "ZIP file does not contain any valid images (.jpg, .png, etc.)."
            return True, f"Valid ZIP archive containing {len(file_list)} items."
    except Exception as e:
        return False, f"Failed to open ZIP file: {str(e)}"

def validate_json_file(file_path):
    """
    Validates if the file at file_path is a valid JSON document.
    Returns (is_valid, message, parsed_data)
    """
    if not os.path.exists(file_path):
        return False, "File does not exist.", None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return True, "Valid JSON document.", data
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON syntax: {str(e)}", None
    except Exception as e:
        return False, f"Error reading JSON file: {str(e)}", None
