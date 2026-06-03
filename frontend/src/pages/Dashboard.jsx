import React, { useEffect } from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import ClassDistributionChart from '../components/dashboard/ClassDistributionChart';
import { 
  FileText, 
  Layers, 
  Image, 
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileX,
  Loader2
} from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { 
    dashboardData, 
    dashboardLoading, 
    dashboardError, 
    fetchDashboardStats,
    zipUploaded,
    jsonUploaded
  } = useDataset();

  // Load stats on mount if uploaded
  useEffect(() => {
    if (zipUploaded && jsonUploaded && !dashboardData) {
      fetchDashboardStats();
    }
  }, [zipUploaded, jsonUploaded]);

  if (dashboardLoading && !dashboardData) {
    return (
      <PageContainer>
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dataset statistics...</p>
        </div>
      </PageContainer>
    );
  }

  if (dashboardError) {
    return (
      <PageContainer>
        <div style={{ height: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
          <h3>Failed to Load Statistics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{dashboardError}</p>
          <button className="btn-primary" onClick={fetchDashboardStats}>
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  // Fallback if user bypasses block
  if (!dashboardData) {
    return (
      <PageContainer>
        <div style={{ height: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Database size={48} style={{ color: 'var(--text-muted)' }} />
          <h3>No Dataset Uploaded</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Please upload your ZIP and JSON files to unlock the dashboard.</p>
        </div>
      </PageContainer>
    );
  }

  const { stats, class_distribution, validation_results } = dashboardData;

  const cardData = [
    { label: 'Total Images', value: stats.total_images.toLocaleString(), icon: Image, color: 'var(--info)' },
    { label: 'Total Annotations', value: stats.total_annotations.toLocaleString(), icon: FileText, color: 'var(--primary)' },
    { label: 'Total Classes', value: stats.total_classes, icon: Layers, color: 'var(--purple)' },
    { label: 'Dataset Size', value: stats.dataset_size, icon: Database, color: 'var(--success)' },
  ];

  return (
    <PageContainer>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
            Dataset Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Here is a summary of your uploaded dataset
          </p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={fetchDashboardStats}
          disabled={dashboardLoading}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={dashboardLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        {cardData.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div key={idx} className="glass-panel stat-card">
              <div className="stat-icon-box" style={{ color: card.color }}>
                <IconComponent size={24} />
              </div>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard split content */}
      <div className="dashboard-split">
        {/* Left: Class Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="dashboard-card-header">
            <h4 className="dashboard-card-title">Class Distribution</h4>
          </div>
          <ClassDistributionChart data={class_distribution} />
        </div>

        {/* Right: Dataset Info Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="dashboard-card-header">
            <h4 className="dashboard-card-title">Dataset Info</h4>
          </div>
          <table className="info-table">
            <tbody>
              <tr>
                <td className="label">Created At</td>
                <td className="value">{stats.created_at}</td>
              </tr>
              <tr>
                <td className="label">Total Images</td>
                <td className="value">{stats.total_images.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="label">Total Annotations</td>
                <td className="value">{stats.total_annotations.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="label">Total Categories</td>
                <td className="value">{stats.total_classes}</td>
              </tr>
              <tr>
                <td className="label">JSON File</td>
                <td className="value" title={stats.json_filename} style={{ maxStrWidth: '150px' }}>
                  {stats.json_filename}
                </td>
              </tr>
              <tr>
                <td className="label">Images Folder</td>
                <td className="value" title={stats.images_folder}>
                  {stats.images_folder}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom: Validation Results Cards */}
      <div className="glass-panel validation-results-section">
        <h4 className="dashboard-card-title">Validation Results</h4>
        <div className="validation-results-grid">
          
          {/* Valid Images */}
          <div className="val-result-card">
            <CheckCircle2 className="val-result-card-icon valid" />
            <div className="val-result-info">
              <span className="val-result-count">{validation_results.valid_images}</span>
              <span className="val-result-label">Valid Images</span>
            </div>
          </div>

          {/* Missing Images */}
          <div className="val-result-card">
            <AlertTriangle className={`val-result-card-icon ${validation_results.missing_images > 0 ? 'alert' : 'valid'}`} style={{ color: validation_results.missing_images > 0 ? 'var(--warning)' : 'var(--success)' }} />
            <div className="val-result-info">
              <span className="val-result-count">{validation_results.missing_images}</span>
              <span className="val-result-label">Missing Images</span>
            </div>
          </div>

          {/* Invalid Boxes */}
          <div className="val-result-card">
            <FileX className={`val-result-card-icon ${validation_results.invalid_boxes > 0 ? 'alert' : 'valid'}`} style={{ color: validation_results.invalid_boxes > 0 ? 'var(--warning)' : 'var(--success)' }} />
            <div className="val-result-info">
              <span className="val-result-count">{validation_results.invalid_boxes}</span>
              <span className="val-result-label">Invalid Boxes</span>
            </div>
          </div>

          {/* Empty Annotations */}
          <div className="val-result-card">
            <HelpCircle className={`val-result-card-icon ${validation_results.empty_annotations > 0 ? 'alert' : 'valid'}`} style={{ color: validation_results.empty_annotations > 0 ? 'var(--warning)' : 'var(--success)' }} />
            <div className="val-result-info">
              <span className="val-result-count">{validation_results.empty_annotations}</span>
              <span className="val-result-label">Empty Annotations</span>
            </div>
          </div>

          {/* Duplicate Annotations */}
          <div className="val-result-card">
            <CheckCircle2 className={`val-result-card-icon ${validation_results.duplicate_annotations > 0 ? 'alert' : 'valid'}`} style={{ color: validation_results.duplicate_annotations > 0 ? 'var(--warning)' : 'var(--success)' }} />
            <div className="val-result-info">
              <span className="val-result-count">{validation_results.duplicate_annotations}</span>
              <span className="val-result-label">Duplicate Annotations</span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
