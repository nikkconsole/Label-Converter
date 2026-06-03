import React, { useState, useEffect } from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { api } from '../services/api';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/logs.css';

export default function Logs() {
  const { logs, fetchLogs } = useDataset();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    try {
      await api.clearLogs();
      fetchLogs();
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  // Pagination Math
  const totalItems = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentLogs = logs.slice(startIndex, endIndex);

  return (
    <PageContainer>
      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
          Activity Logs
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Track all activities and system logs
        </p>
      </div>

      <div className="glass-panel logs-card">
        {/* Logs Table Toolbar */}
        <div className="logs-header">
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            System Event History ({totalItems} total logs)
          </span>
          <button 
            className="btn-secondary" 
            style={{ 
              borderColor: 'rgba(239, 68, 68, 0.2)', 
              color: 'var(--accent-red)',
              fontSize: '12px',
              padding: '6px 12px'
            }}
            onClick={handleClearLogs}
            disabled={totalItems === 0}
          >
            <Trash2 size={13} />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th style={{ width: '220px' }}>Date/Time</th>
                <th style={{ width: '220px' }}>Activity</th>
                <th style={{ width: '120px' }}>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 500 }}>{log.activity}</td>
                  <td>
                    <span className={`status-badge ${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{log.details}</td>
                </tr>
              ))}
              {totalItems === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    No system log entries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination row */}
        {totalItems > 0 && (
          <div className="pagination-row">
            <span>
              Showing {startIndex + 1} to {endIndex} of {totalItems} logs
            </span>
            <div className="pagination-btn-group">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} style={{ display: 'block' }} />
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} style={{ display: 'block' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
