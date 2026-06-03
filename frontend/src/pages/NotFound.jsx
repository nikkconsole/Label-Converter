import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { AlertCircle } from 'lucide-react';

export default function NotFound({ setActiveTab }) {
  return (
    <PageContainer>
      <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
        <h3>Page Not Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>The requested screen does not exist.</p>
        <button className="btn-primary" onClick={() => setActiveTab('home')}>
          <span>Return Home</span>
        </button>
      </div>
    </PageContainer>
  );
}
