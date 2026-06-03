import React, { useState, useEffect } from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { api } from '../services/api';
import { 
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Settings
} from 'lucide-react';
import '../styles/convert.css';

export default function Convert() {
  const { 
    validationResults, 
    conversionState, 
    setConversionState,
    setActiveTab,
    zipUploaded,
    jsonUploaded
  } = useDataset();

  const [selectedFormat, setSelectedFormat] = useState('YOLO'); // 'YOLO' or 'YOLO_OBB'
  const [generateDataFiles, setGenerateDataFiles] = useState(true);
  const [outputDir, setOutputDir] = useState('outputs/yolo_dataset');

  // Sync output directory label with format selection
  useEffect(() => {
    if (selectedFormat === 'YOLO') {
      setOutputDir('outputs/yolo_dataset');
    } else {
      setOutputDir('outputs/yolo_obb_dataset');
    }
  }, [selectedFormat]);

  const handleStartConversion = async () => {
    if (!zipUploaded || !jsonUploaded) return;
    
    try {
      setConversionState(prev => ({
        ...prev,
        status: 'converting',
        format: selectedFormat,
        error_msg: null,
        current: 0,
        percent: 0
      }));
      
      await api.startConversion(selectedFormat, generateDataFiles);
    } catch (err) {
      setConversionState(prev => ({
        ...prev,
        status: 'failed',
        error_msg: err.message || 'Failed to start conversion.'
      }));
    }
  };

  const getStatusIcon = () => {
    switch (conversionState.status) {
      case 'converting':
        return <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />;
      case 'completed':
        return <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />;
      case 'failed':
        return <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />;
      default:
        return <Compass size={32} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const getStatusMessage = () => {
    switch (conversionState.status) {
      case 'converting':
        return 'Converting dataset format...';
      case 'completed':
        return 'Conversion Completed!';
      case 'failed':
        return 'Conversion Failed';
      default:
        return 'Ready to Convert';
    }
  };

  const isConverting = conversionState.status === 'converting';

  return (
    <PageContainer>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
          Convert Dataset
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Choose output format and convert your dataset
        </p>
      </div>

      <div className="convert-split">
        {/* Left Side: Conversion Settings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Select Output Format</h4>
          
          <div className="format-selection-grid">
            {/* Format 1: YOLO */}
            <div 
              className={`format-card ${selectedFormat === 'YOLO' ? 'active' : ''}`}
              onClick={() => !isConverting && setSelectedFormat('YOLO')}
              style={{ pointerEvents: isConverting ? 'none' : 'auto' }}
            >
              <div className="format-card-header">
                <input 
                  type="radio" 
                  checked={selectedFormat === 'YOLO'} 
                  onChange={() => {}}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>YOLO</span>
              </div>
              <p className="format-card-desc">
                Convert to standard YOLO bounding box labels (txt format).
              </p>
            </div>

            {/* Format 2: YOLO OBB */}
            <div 
              className={`format-card ${selectedFormat === 'YOLO_OBB' ? 'active' : ''}`}
              onClick={() => !isConverting && setSelectedFormat('YOLO_OBB')}
              style={{ pointerEvents: isConverting ? 'none' : 'auto' }}
            >
              <div className="format-card-header">
                <input 
                  type="radio" 
                  checked={selectedFormat === 'YOLO_OBB'} 
                  onChange={() => {}}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>YOLO OBB</span>
              </div>
              <p className="format-card-desc">
                Convert to YOLO Oriented Bounding Box labels (4-points normalized format).
              </p>
            </div>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} />
            <span>Conversion Settings</span>
          </h4>

          <div className="settings-group">
            <label className="settings-label">Output Directory</label>
            <input 
              type="text" 
              className="settings-input" 
              value={outputDir} 
              readOnly 
              title="Outputs are generated relative to the backend root"
            />
          </div>

          <div className="settings-toggle-row">
            <div>
              <span style={{ fontSize: '13px', fontWeight: 500, display: 'block' }}>Generate Data Files</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Generate obj.names, obj.data, and train.txt metadata files
              </span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={generateDataFiles}
                disabled={isConverting}
                onChange={(e) => setGenerateDataFiles(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            disabled={isConverting}
            onClick={handleStartConversion}
          >
            {isConverting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Start Conversion</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Progress status */}
        <div className="glass-panel progress-card">
          <div className={`progress-icon-box ${conversionState.status}`}>
            {getStatusIcon()}
          </div>

          <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{getStatusMessage()}</h4>
          
          {conversionState.status === 'converting' && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              Processing files...
            </p>
          )}

          {conversionState.status === 'idle' && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              Click the button on the left to start converting your dataset.
            </p>
          )}

          {/* Progress Bar */}
          <div style={{ width: '100%', padding: '0 24px' }}>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${conversionState.percent}%` }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Progress</span>
              <span>{conversionState.percent}%</span>
            </div>
            {isConverting && (
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {conversionState.current.toLocaleString()} / {conversionState.total.toLocaleString()} images
              </div>
            )}
          </div>

          {/* Checklist summary */}
          <ul className="convert-summary-list">
            <li className="convert-summary-item">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span>Images Found: <strong>{validationResults.stats.num_images.toLocaleString()}</strong></span>
            </li>
            <li className="convert-summary-item">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span>Annotations Found: <strong>{validationResults.stats.num_annotations.toLocaleString()}</strong></span>
            </li>
            <li className="convert-summary-item">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span>Selected Format: <strong>{selectedFormat}</strong></span>
            </li>
          </ul>

          {/* Navigation link once finished */}
          {conversionState.status === 'completed' && (
            <button 
              className="btn-primary" 
              onClick={() => setActiveTab('download')}
              style={{ marginTop: '24px', background: 'var(--success)', boxShadow: '0 4px 15px var(--success-glow)' }}
            >
              <span>Proceed to Download</span>
              <ArrowRight size={16} />
            </button>
          )}

          {conversionState.status === 'failed' && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%', fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Error:</strong> {conversionState.error_msg}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
