import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, NavLink } from 'react-router-dom';
import { initDB } from './db/database';

import Dashboard from './components/Dashboard';
import Project from './components/Project';
import Settings from './components/Settings';
import ProjectModal from './components/ProjectModal';

import './styles/variables.css';
import './styles/main.css';

// Wrapper to pass route params to Project component
const ProjectWrapper = ({ onNavigate }) => {
  const { id } = useParams();
  return <Project projectId={id} onNavigate={onNavigate} />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState('');

  // Key to force refresh of Dashboard when data changes
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setBootLoading(true);
      setBootError('');
      await initDB();
      setDbReady(true);
    } catch (error) {
      console.error('Error initializing database:', error);
      setBootError('שגיאה באתחול האפליקציה. נסה לרענן את הדף.');
      setDbReady(false);
    } finally {
      setBootLoading(false);
    }
  };

  const handleNavigate = (view, projectId = null) => {
    if (view === 'dashboard') navigate('/');
    else if (view === 'settings') navigate('/settings');
    else if (view === 'project' && projectId) navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => setShowProjectModal(true);

  const handleProjectCreated = () => {
    setShowProjectModal(false);
    // Force dashboard refresh
    setDashboardKey(prev => prev + 1);
    navigate('/');
  };

  const headerTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/project')) return 'פרויקט';
    if (path === '/settings') return 'הגדרות';
    return 'לוח בקרה';
  }, [location.pathname]);

  if (bootLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)', fontWeight: 600 }}>
          טוען...
        </div>
        <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          מאתחל את מסד הנתונים
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="fade-in" style={{ padding: 'var(--spacing-2xl)' }}>
        <div className="container">
          <div className="card">
            <div className="section-header">
              <div>
                <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>אופס…</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  {bootError || 'לא הצלחנו לאתחל את האפליקציה.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', marginTop: 'var(--spacing-xl)' }}>
              <button className="btn btn-primary" onClick={initializeApp}>
                🔄 נסה שוב
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
                title="רענון מלא של הדף"
              >
                ⟳ רענון דף
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="root">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <div className="logo">מנהל הכספים שלי</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{headerTitle}</div>
            </div>

            <nav className="nav" aria-label="Main navigation">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                לוח בקרה
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                הגדרות
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  key={dashboardKey}
                  onNavigate={handleNavigate}
                  onCreateProject={handleCreateProject}
                />
              }
            />
            <Route
              path="/project/:id"
              element={<ProjectWrapper onNavigate={handleNavigate} />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <Dashboard
                  onNavigate={handleNavigate}
                  onCreateProject={handleCreateProject}
                />
              }
            />
          </Routes>
        </div>
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
}

export default App;
