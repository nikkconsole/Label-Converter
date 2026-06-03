import React from 'react';
import { 
  Home, 
  UploadCloud, 
  LayoutDashboard, 
  RefreshCw, 
  Eye, 
  Terminal, 
  Download,
  Sun, 
  Moon 
} from 'lucide-react';
import { useDataset } from '../../context/DatasetContext';
import '../../styles/sidebar.css';

export default function Sidebar({ isOpen, onClose, onNavClick }) {
  const { activeTab, setActiveTab, zipUploaded, jsonUploaded, conversionState, theme, toggleTheme } = useDataset();

  const handleNav = (id, disabled) => {
    if (disabled) return;
    setActiveTab(id);
    if (onNavClick) onNavClick();
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, disabled: false },
    { id: 'upload', label: 'Upload Dataset', icon: UploadCloud, disabled: false },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      disabled: !(zipUploaded && jsonUploaded) 
    },
    { 
      id: 'convert', 
      label: 'Convert', 
      icon: RefreshCw, 
      disabled: !(zipUploaded && jsonUploaded) 
    },
    { 
      id: 'visualize', 
      label: 'Visualize', 
      icon: Eye, 
      disabled: !(zipUploaded && jsonUploaded) 
    },
    {
      id: 'download',
      label: 'Download',
      icon: Download,
      disabled: !conversionState.result
    },
    { id: 'logs', label: 'Logs', icon: Terminal, disabled: false }
  ];

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="brand">
          <div className="brand-icon">
            <svg
              className="brand-logo-img"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Label tag shape */}
              <path
                d="M4 6 Q4 3 7 3 L20 3 L28 11 L28 25 Q28 29 24 29 L7 29 Q4 29 4 26 Z"
                fill="white"
                opacity="0.95"
              />
              {/* Hole on the label */}
              <circle cx="9" cy="9" r="2.2" fill="url(#sidebarGrad)" />
              {/* LC text */}
              <text
                x="16" y="22"
                fontFamily="'Poppins', Arial, sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="url(#sidebarGrad)"
                textAnchor="middle"
              >
                LC
              </text>
              <defs>
                <linearGradient id="sidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-name">
            Label<br />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Converter
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav>
          <ul className="nav-list">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id, item.disabled)}
                    disabled={item.disabled}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      opacity: item.disabled ? 0.35 : 1,
                      cursor: item.disabled ? 'not-allowed' : 'pointer'
                    }}
                    title={item.disabled ? "Upload files to unlock this page" : ""}
                  >
                    <IconComponent className="nav-link-icon" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer controls */}
      <div className="sidebar-footer">
        {/* Theme Toggle */}
        <div className="theme-switch" onClick={toggleTheme} title="Toggle light/dark mode">
          <div className="theme-switch-btn">
            {theme === 'dark' ? (
              <Moon size={14} style={{ color: 'var(--primary)' }} />
            ) : (
              <Sun size={14} style={{ color: 'var(--warning)' }} />
            )}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          {theme === 'dark' ? (
            <Sun size={14} style={{ opacity: 0.5 }} />
          ) : (
            <Moon size={14} style={{ opacity: 0.5 }} />
          )}
        </div>


      </div>
    </aside>
  );
}
