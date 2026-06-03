import os
import shutil
import logging

logger = logging.getLogger(__name__)

def cleanup_old_tasks(directory, max_tasks=2):
    """
    Scans the given directory for task folders (folders starting with 'task_').
    If there are more than max_tasks, deletes the oldest ones.
    """
    if not os.path.exists(directory):
        return

    # Find all task directories
    task_dirs = []
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        if os.path.isdir(item_path) and item.startswith("task_"):
            task_dirs.append(item_path)

    # Sort by creation time (or modification time)
    # Using getctime on Windows, but getmtime is safer across platforms for "oldest"
    task_dirs.sort(key=os.path.getmtime)

    # If we have more than max_tasks, delete the oldest
    if len(task_dirs) > max_tasks:
        dirs_to_delete = task_dirs[:-max_tasks]
        for dir_to_delete in dirs_to_delete:
            try:
                shutil.rmtree(dir_to_delete)
                logger.info(f"Cleaned up old task directory: {dir_to_delete}")
            except Exception as e:
                logger.error(f"Failed to delete old task directory {dir_to_delete}: {e}")
