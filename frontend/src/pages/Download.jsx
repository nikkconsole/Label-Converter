import React from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { api } from '../services/api';
import { CheckCircle, DownloadCloud, ArrowLeft, LayoutDashboard } from 'lucide-react';
import '../styles/download.css';

export default function Download() {
  const { conversionState, setActiveTab } = useDataset();

  const handleDownload = async () => {
    try {
      const url = api.getDownloadUrl(false);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      
      const format = (conversionState.result?.target_format || 'yolo').toLowerCase();
      const defaultName = `converted_annotations_${format}.zip`;

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [{
            description: 'ZIP Archive',
            accept: { 'application/zip': ['.zip'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        console.error('Download error:', error);
        alert('Failed to download file or user cancelled.');
      }
    }
  };

  const hasResult = !!conversionState.result;
  const result = conversionState.result || {};

  const summaryRows = [
    { label: 'Output Format',         value: result.target_format || 'YOLO' },
    { label: 'Images Processed',      value: (result.images_processed || 0).toLocaleString() },
    { label: 'Annotations Converted', value: (result.labels_generated || 0).toLocaleString() },
    { label: 'Data Files Generated',  value: 'obj.names, obj.data, train.txt', color: 'var(--primary)' },
    { label: 'Output Archive Size',   value: result.output_size || '0 KB', color: 'var(--success)' },
  ];

  return (
    <PageContainer>
      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
          Conversion Complete
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Your dataset has been converted and is ready for download
        </p>
      </div>

      <div className="download-grid">

        {/* Left: Status */}
        <div className="glass-panel download-status-card">
          <div className="download-check-icon">
            <CheckCircle size={48} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Ready to Download</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, maxWidth: '280px', marginBottom: '32px' }}>
            Click the button below to retrieve your converted labels, images, and config support files in a single ZIP.
          </p>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', background: 'var(--success)', boxShadow: '0 4px 15px var(--success-glow)' }}
            onClick={handleDownload}
            disabled={!hasResult}
          >
            <DownloadCloud size={16} />
            <span>Download Converted Dataset (ZIP)</span>
          </button>
        </div>

        {/* Right: Summary */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Converter Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {summaryRows.map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                <strong style={{ fontSize: '13px', color: color || 'var(--text-primary)', textAlign: 'right' }}>{value}</strong>
              </div>
            ))}
          </div>
          <div className="download-actions">
            <button className="btn-secondary" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={14} /><span>Go to Dashboard</span>
            </button>
            <button className="btn-secondary" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={() => setActiveTab('convert')}>
              <ArrowLeft size={14} /><span>Convert Again</span>
            </button>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
