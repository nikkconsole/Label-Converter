import React from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { UploadCloud, LayoutDashboard, CheckCircle2, Clock } from 'lucide-react';
import '../styles/home.css';

export default function Home() {
  const { setActiveTab, zipUploaded, jsonUploaded } = useDataset();

  return (
    <PageContainer>
      <div className="home-hero">

        {/* Left: Hero text */}
        <div>
          <h1 className="home-hero-title">
            Convert Your{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Datasets
            </span>{' '}
            Effortlessly
          </h1>
          <p className="home-hero-sub">
            Upload your COCO dataset annotations along with your images zip file, validate
            coordinates, and convert them to YOLO or YOLO OBB formats in just a few clicks.
          </p>
          <div className="home-hero-actions">
            <button className="btn-primary" onClick={() => setActiveTab('upload')}>
              <UploadCloud size={18} />
              <span>Upload Dataset</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('dashboard')}
              disabled={!(zipUploaded && jsonUploaded)}
              style={{
                opacity: !(zipUploaded && jsonUploaded) ? 0.5 : 1,
                cursor: !(zipUploaded && jsonUploaded) ? 'not-allowed' : 'pointer',
              }}
            >
              <LayoutDashboard size={18} />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>

        {/* Right: SVG illustration */}
        <div className="home-hero-illustration">
          <div className="glass-panel flex-center home-hero-svg-box">
            <div className="home-hero-glow" />
            <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ zIndex: 1, maxWidth: '240px' }}>
              <rect x="75" y="80" width="50" height="40" rx="6" fill="#1b2042" stroke="#6366f1" strokeWidth="2" />
              <path d="M75 90h50" stroke="#6366f1" strokeWidth="1.5" />
              <circle cx="85" cy="105" r="3" fill="#10b981" />
              <circle cx="100" cy="105" r="3" fill="#8b5cf6" />
              <g transform="translate(88, 30)">
                <path d="M12 2C7.58 2 4 5.58 4 10c0 .41.04.81.1 1.2A5 5 0 0 0 0 16a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5 5 5 0 0 0-4.1-4.8c.06-.39.1-.79.1-1.2 0-4.42-3.58-8-8-8z" fill="#6366f1" opacity="0.15" />
                <path d="M12 5v10M9 8l3-3 3 3" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
              <rect x="15" y="60" width="40" height="20" rx="4" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="1" />
              <text x="35" y="73" fill="#10b981" fontSize="9" fontWeight="600" textAnchor="middle">COCO</text>
              <rect x="145" y="55" width="40" height="20" rx="4" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="1" />
              <text x="165" y="68" fill="#6366f1" fontSize="9" fontWeight="600" textAnchor="middle">YOLO</text>
              <rect x="145" y="105" width="40" height="20" rx="4" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" strokeWidth="1" />
              <text x="165" y="117" fill="#8b5cf6" fontSize="8" fontWeight="600" textAnchor="middle">YOLO OBB</text>
              <path d="M55 70h20" stroke="#10b981" strokeDasharray="3,3" fill="none" />
              <path d="M125 90h20" stroke="#6366f1" strokeDasharray="3,3" fill="none" />
              <path d="M125 105h20" stroke="#8b5cf6" strokeDasharray="3,3" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Supported Formats */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-headings)' }}>
          Supported Formats
        </h3>
        <div className="home-formats-grid">

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>YOLO</span>
              <CheckCircle2 size={20} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Output Format</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Convert to YOLO bounding box files (class_idx xc yc w h).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>YOLO OBB</span>
              <CheckCircle2 size={20} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Output Format</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Convert to YOLO Oriented Bounding Box vertices (x1 y1 x2 y2 x3 y3 x4 y4).
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', opacity: 0.85 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>More Coming Soon</span>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Upcoming</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Pascal VOC (XML) and Keypoint conversions are coming soon.
            </p>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
