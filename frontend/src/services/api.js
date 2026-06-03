const API_BASE = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

/**
 * Fetch wrapper with AbortController timeout.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs  default 5 minutes for large uploads
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 300000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond.');
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

export const api = {
  // Upload endpoints
  uploadZip: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithTimeout(`${API_BASE}/upload/zip`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload ZIP');
    }
    return response.json();
  },

  uploadJson: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithTimeout(`${API_BASE}/upload/json`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload JSON');
    }
    return response.json();
  },

  getUploadStatus: async () => {
    const response = await fetch(`${API_BASE}/upload/status`);
    if (!response.ok) throw new Error('Failed to get upload status');
    return response.json();
  },

  resetUpload: async () => {
    const response = await fetch(`${API_BASE}/upload/reset`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reset state');
    return response.json();
  },

  // Dashboard endpoints
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE}/dashboard/stats`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get dashboard stats');
    }
    return response.json();
  },

  // Convert endpoints
  startConversion: async (format, generateDataFiles = true) => {
    const response = await fetch(`${API_BASE}/convert/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format, generate_data_files: generateDataFiles }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to start conversion');
    }
    return response.json();
  },

  getConversionStatus: async () => {
    const response = await fetch(`${API_BASE}/convert/status`);
    if (!response.ok) throw new Error('Failed to get conversion status');
    return response.json();
  },

  // Visualize endpoints
  getImages: async () => {
    const response = await fetch(`${API_BASE}/visualize/images`);
    if (!response.ok) throw new Error('Failed to get images manifest');
    return response.json();
  },

  getImageUrl: (imageId) => {
    return `${API_BASE}/visualize/image/${imageId}`;
  },

  getAnnotations: async (imageId) => {
    const response = await fetch(`${API_BASE}/visualize/annotations/${imageId}`);
    if (!response.ok) throw new Error('Failed to get image annotations');
    return response.json();
  },

  // Download endpoints
  getDownloadUrl: (includeImages = true) => {
    return `${API_BASE}/download/dataset?include_images=${includeImages}`;
  },

  // Logs endpoints
  getLogs: async () => {
    const response = await fetch(`${API_BASE}/logs`);
    if (!response.ok) throw new Error('Failed to get logs');
    return response.json();
  },

  clearLogs: async () => {
    const response = await fetch(`${API_BASE}/logs/clear`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to clear logs');
    return response.json();
  }
};
