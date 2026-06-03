import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const DatasetContext = createContext(null);

export const DatasetProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  // Theme: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const [zipUploaded, setZipUploaded] = useState(false);
  const [jsonUploaded, setJsonUploaded] = useState(false);
  
  const [validationResults, setValidationResults] = useState({
    zip_valid: false,
    zip_msg: "No ZIP file uploaded",
    json_valid: false,
    json_msg: "No JSON file uploaded",
    structure_valid: false,
    structure_errors: [],
    stats: {
      num_images: 0,
      num_annotations: 0,
      num_categories: 0,
      categories_found: []
    },
    bbox_validation: {
      valid_count: 0,
      invalid_boxes: [],
      duplicate_boxes: [],
      empty_annotations: []
    }
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const [conversionState, setConversionState] = useState({
    status: 'idle',
    format: null,
    current: 0,
    total: 0,
    percent: 0,
    error_msg: null,
    result: null
  });

  const [logs, setLogs] = useState([]);

  // Fetch initial statuses
  const fetchUploadStatus = async () => {
    try {
      const data = await api.getUploadStatus();
      setValidationResults(data);
      setZipUploaded(data.zip_valid);
      setJsonUploaded(data.json_valid);
    } catch (err) {
      console.error("Failed to load upload status", err);
    }
  };

  const fetchDashboardStats = async () => {
    if (!zipUploaded || !jsonUploaded) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await api.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      setDashboardError(err.message || 'Failed to fetch dashboard stats');
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  const resetDataset = async () => {
    try {
      await api.resetUpload();
      setZipUploaded(false);
      setJsonUploaded(false);
      setDashboardData(null);
      setConversionState({
        status: 'idle',
        format: null,
        current: 0,
        total: 0,
        percent: 0,
        error_msg: null,
        result: null
      });
      await fetchUploadStatus();
      await fetchLogs();
    } catch (err) {
      console.error("Failed to reset dataset", err);
    }
  };

  // Poll conversion status when active
  useEffect(() => {
    let intervalId;
    if (conversionState.status === 'converting') {
      intervalId = setInterval(async () => {
        try {
          const res = await api.getConversionStatus();
          setConversionState({
            status: res.status.status,
            format: res.status.format,
            current: res.status.current,
            total: res.status.total,
            percent: res.status.percent,
            error_msg: res.status.error_msg,
            result: res.result
          });
          
          if (res.status.status === 'completed' || res.status.status === 'failed') {
            clearInterval(intervalId);
            fetchLogs();
          }
        } catch (err) {
          console.error("Error polling conversion status", err);
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [conversionState.status]);

  useEffect(() => {
    fetchUploadStatus();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (zipUploaded && jsonUploaded) {
      fetchDashboardStats();
    }
  }, [zipUploaded, jsonUploaded]);

  return (
    <DatasetContext.Provider value={{
      activeTab,
      setActiveTab,
      theme,
      toggleTheme,
      zipUploaded,
      setZipUploaded,
      jsonUploaded,
      setJsonUploaded,
      validationResults,
      fetchUploadStatus,
      dashboardData,
      dashboardLoading,
      dashboardError,
      fetchDashboardStats,
      conversionState,
      setConversionState,
      resetDataset,
      logs,
      fetchLogs
    }}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};
