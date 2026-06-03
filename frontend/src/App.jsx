import React, { useState } from 'react';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import Sidebar from './components/layout/Sidebar';

// Pages
import Home from './pages/Home';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Convert from './pages/Convert';
import Visualize from './pages/Visualize';
import Download from './pages/Download';
import Logs from './pages/Logs';
import NotFound from './pages/NotFound';

// Global Styles
import './styles/global.css';

function MainAppContent() {
  const { activeTab, setActiveTab } = useDataset();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':      return <Home />;
      case 'upload':    return <Upload />;
      case 'dashboard': return <Dashboard />;
      case 'convert':   return <Convert />;
      case 'visualize': return <Visualize />;
      case 'download':  return <Download />;
      case 'logs':      return <Logs />;
      default:          return <NotFound setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavClick={() => setSidebarOpen(false)}
      />

      <div style={{ flexGrow: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <span className="mobile-brand-name">Label Converter</span>
        </div>

        {renderActivePage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DatasetProvider>
      <MainAppContent />
    </DatasetProvider>
  );
}
