import Home from './pages/Home';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Convert from './pages/Convert';
import Visualize from './pages/Visualize';
import Download from './pages/Download';
import Logs from './pages/Logs';

// Configurable routes schema for tab navigation
export const routes = [
  { path: 'home', component: Home, name: 'Home' },
  { path: 'upload', component: Upload, name: 'Upload' },
  { path: 'dashboard', component: Dashboard, name: 'Dashboard' },
  { path: 'convert', component: Convert, name: 'Convert' },
  { path: 'visualize', component: Visualize, name: 'Visualize' },
  { path: 'download', component: Download, name: 'Download' },
  { path: 'logs', component: Logs, name: 'Logs' }
];
