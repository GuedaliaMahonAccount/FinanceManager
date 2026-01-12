import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { projectsAPI, transactionsAPI, settingsAPI } from '../services/apiService';
import { convertCurrency, formatCurrency } from '../services/currencyService';

const Dashboard = ({ onNavigate, onCreateProject }) => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, total: 0 });
  const [displayCurrency, setDisplayCurrency] = useState('ILS');
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(async (transactions, currency) => {
    const converted = await Promise.all(
      transactions.map(async (t) => {
        const amount = await convertCurrency(t.amount, t.currency, currency, t.date);
        return { ...t, convertedAmount: amount };
      })
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of converted) {
      if (t.type === 'income') totalIncome += t.convertedAmount;
      else totalExpenses += t.convertedAmount;
    }

    setStats({
      totalIncome,
      totalExpenses,
      total: totalIncome - totalExpenses,
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [projectsData, settingsData] = await Promise.all([
        projectsAPI.getAll(),
        settingsAPI.getAll(),
      ]);

      setProjects(projectsData || []);

      const currency = settingsData?.displayCurrency || 'ILS';
      setDisplayCurrency(currency);

      const allTransactions = await transactionsAPI.getAll();
      await calculateStats(allTransactions || [], currency);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="card-header">
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>לוח בקרה</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            סקירה כללית של כל הפרויקטים שלך
          </p>
        </div>

        <button className="btn btn-primary" onClick={onCreateProject}>
          <span>➕</span>
          פרויקט חדש
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <div className="stats-card success">
          <div className="stats-icon">💰</div>
          <div className="stats-label">סך הכנסות</div>
          <div className="stats-value">
            {formatCurrency(stats.totalIncome, displayCurrency)}
          </div>
        </div>

        <div className="stats-card danger">
          <div className="stats-icon">💸</div>
          <div className="stats-label">סך הוצאות</div>
          <div className="stats-value">
            {formatCurrency(stats.totalExpenses, displayCurrency)}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">📊</div>
          <div className="stats-label">יתרה</div>
          <div
            className="stats-value"
            style={{
              color: stats.total >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {formatCurrency(stats.total, displayCurrency)}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2>הפרויקטים שלי</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {projects.length} {projects.length === 1 ? 'פרויקט' : 'פרויקטים'}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-text">אין פרויקטים עדיין</div>
          <p style={{ marginBottom: 'var(--spacing-xl)', color: 'var(--text-dim)' }}>
            צור את הפרויקט הראשון שלך כדי להתחיל לעקוב אחר ההכנסות וההוצאות
          </p>
          <button className="btn btn-primary" onClick={onCreateProject}>
            <span>➕</span>
            צור את הפרויקט הראשון שלך
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {projects.map((project) => {
            const projectId = project._id || project.id;
            return (
              <ProjectCard
                key={projectId}
                project={project}
                displayCurrency={displayCurrency}
                onClick={() => onNavigate('project', projectId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, displayCurrency, onClick }) => {
  const projectId = useMemo(() => project._id || project.id, [project._id, project.id]);

  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    total: 0,
    transactionCount: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadProjectStats = useCallback(async () => {
    try {
      setLoading(true);

      const transactions = await transactionsAPI.getByProject(projectId);
      const txs = transactions || [];

      const converted = await Promise.all(
        txs.map(async (t) => {
          const amount = await convertCurrency(t.amount, t.currency, displayCurrency, t.date);
          return { ...t, convertedAmount: amount };
        })
      );

      let income = 0;
      let expenses = 0;

      for (const t of converted) {
        if (t.type === 'income') income += t.convertedAmount;
        else expenses += t.convertedAmount;
      }

      setStats({
        income,
        expenses,
        total: income - expenses,
        transactionCount: txs.length,
      });
    } catch (error) {
      console.error('Error loading project stats:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, displayCurrency]);

  useEffect(() => {
    loadProjectStats();
  }, [loadProjectStats]);

  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{project.name}</h3>

        {project.description ? (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
          >
            {project.description}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                הכנסות
              </div>
              <div
                style={{
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: '1.25rem',
                }}
              >
                {formatCurrency(stats.income, displayCurrency)}
              </div>
            </div>

            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                הוצאות
              </div>
              <div
                style={{
                  color: 'var(--color-danger)',
                  fontWeight: '700',
                  fontSize: '1.25rem',
                }}
              >
                {formatCurrency(stats.expenses, displayCurrency)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--spacing-md)',
              borderTop: '2px solid var(--border-color)',
            }}
          >
            <span
              style={{
                fontWeight: '700',
                fontSize: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              סה״כ
            </span>

            <span
              style={{
                fontWeight: '800',
                fontSize: '1.5rem',
                color: stats.total >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {formatCurrency(stats.total, displayCurrency)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              color: 'var(--text-dim)',
              fontSize: '0.875rem',
              marginTop: 'var(--spacing-sm)',
            }}
          >
            <span>📋</span>
            <span>
              {stats.transactionCount} {stats.transactionCount === 1 ? 'תנועה' : 'תנועות'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
