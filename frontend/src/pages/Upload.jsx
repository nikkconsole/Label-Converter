import React, { useState, useRef, useCallback } from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { api } from '../services/api';
import {
  UploadCloud,
  FileText,
  FileArchive,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import '../styles/upload.css';

export default function Upload() {
  const {
    setActiveTab,
    zipUploaded,
    setZipUploaded,
    jsonUploaded,
    setJsonUploaded,
    validationResults,
    fetchUploadStatus,
    resetDataset
  } = useDataset();

  const [zipLoading, setZipLoading]     = useState(false);
  const [zipError,   setZipError]       = useState(null);
  const [zipFileName, setZipFileName]   = useState('');
  const [zipFileSize, setZipFileSize]   = useState('');
  const [zipElapsed,  setZipElapsed]    = useState(0);
  const [zipDragOver, setZipDragOver]   = useState(false);

  const [jsonLoading, setJsonLoading]   = useState(false);
  const [jsonError,   setJsonError]     = useState(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonFileSize, setJsonFileSize] = useState('');
  const [jsonDragOver, setJsonDragOver] = useState(false);

  const zipInputRef  = useRef(null);
  const jsonInputRef = useRef(null);
  const zipTimerRef  = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k  = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // ── ZIP ──────────────────────────────────────────────────────
  const processZipFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipError('Please upload a .zip file.');
      return;
    }
    setZipFileName(file.name);
    setZipFileSize(formatBytes(file.size));
    setZipLoading(true);
    setZipError(null);
    setZipElapsed(0);

    zipTimerRef.current = setInterval(() => {
      setZipElapsed(prev => prev + 1);
    }, 1000);

    try {
      await api.uploadZip(file);
      setZipUploaded(true);
      await fetchUploadStatus();
    } catch (err) {
      setZipError(err.message || 'ZIP upload failed.');
      setZipUploaded(false);
    } finally {
      clearInterval(zipTimerRef.current);
      setZipLoading(false);
      setZipElapsed(0);
    }
  }, [fetchUploadStatus, setZipUploaded]);

  const handleZipChange    = (e) => processZipFile(e.target.files[0]);
  const handleZipDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); setZipDragOver(true);  };
  const handleZipDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setZipDragOver(false); };
  const handleZipDrop      = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setZipDragOver(false);
    processZipFile(e.dataTransfer.files[0]);
  };

  // ── JSON ─────────────────────────────────────────────────────
  const processJsonFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setJsonError('Please upload a .json file.');
      return;
    }
    setJsonFileName(file.name);
    setJsonFileSize(formatBytes(file.size));
    setJsonLoading(true);
    setJsonError(null);

    try {
      await api.uploadJson(file);
      setJsonUploaded(true);
      await fetchUploadStatus();
    } catch (err) {
      setJsonError(err.message || 'JSON upload failed.');
      setJsonUploaded(false);
    } finally {
      setJsonLoading(false);
    }
  }, [fetchUploadStatus, setJsonUploaded]);

  const handleJsonChange    = (e) => processJsonFile(e.target.files[0]);
  const handleJsonDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); setJsonDragOver(true);  };
  const handleJsonDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setJsonDragOver(false); };
  const handleJsonDrop      = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setJsonDragOver(false);
    processJsonFile(e.dataTransfer.files[0]);
  };

  const getValidationIcon = (isValid, isUploaded) => {
    if (!isUploaded) return <CheckCircle2 className="validation-icon pending" />;
    return isValid
      ? <CheckCircle2 className="validation-icon valid" />
      : <XCircle     className="validation-icon invalid" />;
  };

  const isFormValid = zipUploaded && jsonUploaded && validationResults.structure_valid;

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
            Upload Your Dataset
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Upload your images zip file and COCO JSON annotation file to start
          </p>
        </div>
        {(zipUploaded || jsonUploaded) && (
          <button
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
            onClick={resetDataset}
          >
            <RefreshCw size={14} />
            <span>Reset Files</span>
          </button>
        )}
      </div>

      <div className="upload-grid">

        {/* ── Card 1: ZIP ── */}
        <div className="glass-panel upload-card">
          <h3>1. Upload Images (ZIP)</h3>
          <p className="subtitle">Drag & drop your images archive here, or click to browse</p>

          <input
            type="file"
            ref={zipInputRef}
            onChange={handleZipChange}
            accept=".zip"
            style={{ display: 'none' }}
          />

          <div
            className={`dropzone${zipDragOver ? ' drag-over' : ''}`}
            onClick={() => zipInputRef.current.click()}
            onDragOver={handleZipDragOver}
            onDragEnter={handleZipDragOver}
            onDragLeave={handleZipDragLeave}
            onDrop={handleZipDrop}
          >
            <UploadCloud className="dropzone-icon" />
            <p>{zipDragOver ? 'Release to upload' : 'Drag & drop images.zip here'}</p>
            <span>or click to browse</span>
          </div>

          {zipLoading && (
            <div className="file-status-bar loading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span>
                  Uploading and extracting...
                  {zipElapsed > 3 && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({zipElapsed}s — large archives may take a moment)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {zipError && !zipLoading && (
            <div className="file-status-bar error">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} style={{ color: 'var(--danger)' }} />
                <span>{zipError}</span>
              </div>
            </div>
          )}

          {zipUploaded && !zipLoading && (
            <div className="file-status-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileArchive size={16} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 500 }}>{zipFileName} ({zipFileSize})</span>
              </div>
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            </div>
          )}
        </div>

        {/* ── Card 2: JSON ── */}
        <div className="glass-panel upload-card">
          <h3>2. Upload COCO JSON</h3>
          <p className="subtitle">Drag & drop your annotation JSON file here, or click to browse</p>

          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleJsonChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <div
            className={`dropzone${jsonDragOver ? ' drag-over' : ''}`}
            onClick={() => jsonInputRef.current.click()}
            onDragOver={handleJsonDragOver}
            onDragEnter={handleJsonDragOver}
            onDragLeave={handleJsonDragLeave}
            onDrop={handleJsonDrop}
          >
            <UploadCloud className="dropzone-icon" />
            <p>{jsonDragOver ? 'Release to upload' : 'Drag & drop annotations.json here'}</p>
            <span>or click to browse</span>
          </div>

          {jsonLoading && (
            <div className="file-status-bar loading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span>Uploading and validating JSON schema...</span>
              </div>
            </div>
          )}

          {jsonError && !jsonLoading && (
            <div className="file-status-bar error">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} style={{ color: 'var(--danger)' }} />
                <span>{jsonError}</span>
              </div>
            </div>
          )}

          {jsonUploaded && !jsonLoading && (
            <div className="file-status-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 500 }}>{jsonFileName} ({jsonFileSize})</span>
              </div>
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            </div>
          )}
        </div>

      </div>

      {/* Validation Preview */}
      <div className="glass-panel validation-preview">
        <h4 className="validation-header">Validation Preview</h4>
        <div className="validation-checklist">

          <div className={`validation-item ${zipUploaded && validationResults.zip_valid ? 'valid' : ''}`}>
            {getValidationIcon(validationResults.zip_valid, zipUploaded)}
            <span>ZIP File: {zipUploaded ? (validationResults.zip_valid ? 'Valid' : 'Invalid') : 'Pending'}</span>
          </div>

          <div className={`validation-item ${jsonUploaded && validationResults.json_valid ? 'valid' : ''}`}>
            {getValidationIcon(validationResults.json_valid, jsonUploaded)}
            <span>JSON File: {jsonUploaded ? (validationResults.json_valid ? 'Valid' : 'Invalid') : 'Pending'}</span>
          </div>

          <div className={`validation-item ${jsonUploaded && validationResults.structure_valid ? 'valid' : ''}`}>
            {getValidationIcon(validationResults.structure_valid, jsonUploaded)}
            <span>COCO Structure: {jsonUploaded ? (validationResults.structure_valid ? 'Valid' : 'Invalid') : 'Pending'}</span>
          </div>

          <div className={`validation-item ${jsonUploaded && validationResults.stats.num_categories > 0 ? 'valid' : ''}`}>
            {getValidationIcon(validationResults.stats.num_categories > 0, jsonUploaded)}
            <span>
              Categories: {jsonUploaded && validationResults.stats.num_categories > 0
                ? `${validationResults.stats.num_categories} Classes Found`
                : 'Pending'}
            </span>
          </div>

        </div>

        {jsonUploaded && !validationResults.structure_valid && validationResults.structure_errors.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', display: 'block', marginBottom: '4px' }}>
              Schema Structure Errors:
            </span>
            <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '16px' }}>
              {validationResults.structure_errors.slice(0, 5).map((err, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>{err}</li>
              ))}
              {validationResults.structure_errors.length > 5 && (
                <li>...and {validationResults.structure_errors.length - 5} more errors.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Proceed */}
      <div className="action-row">
        <button
          className="btn-primary"
          disabled={!isFormValid}
          onClick={() => setActiveTab('dashboard')}
          style={{ opacity: !isFormValid ? 0.5 : 1, cursor: !isFormValid ? 'not-allowed' : 'pointer' }}
        >
          <span>Proceed to Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </PageContainer>
  );
}
