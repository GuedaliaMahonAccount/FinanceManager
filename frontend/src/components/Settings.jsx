import React, { useEffect, useMemo, useState } from 'react';
import { settingsAPI, labelsAPI } from '../services/apiService';

const CURRENCIES = [
  { code: 'ILS', name: 'שקל חדש', symbol: '₪' },
  { code: 'USD', name: 'דולר אמריקאי', symbol: '$' },
  { code: 'EUR', name: 'יורו', symbol: '€' },
];

const Settings = () => {
  const [displayCurrency, setDisplayCurrency] = useState('ILS');
  const [labels, setLabels] = useState([]);
  const [editingLabelId, setEditingLabelId] = useState(null);

  const [draftLabel, setDraftLabel] = useState({ id: '', name: '', color: '#6366f1' });
  const [newLabel, setNewLabel] = useState({ name: '', color: '#6366f1' });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const normalizedLabels = useMemo(
    () =>
      (labels || [])
        .filter(Boolean)
        .map((l) => ({
          id: l._id || l.id,
          name: l.name || '',
          color: l.color || '#6366f1',
        })),
    [labels]
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      setNotice({ type: '', text: '' });

      const [settingsData, labelsData] = await Promise.all([settingsAPI.getAll(), labelsAPI.getAll()]);

      setDisplayCurrency(settingsData?.displayCurrency || 'ILS');
      setLabels((labelsData || []).filter(Boolean));
    } catch (error) {
      console.error('Error loading settings:', error);
      setNotice({ type: 'danger', text: 'שגיאה בטעינת ההגדרות. נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    if (newCurrency === displayCurrency) return;

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      await settingsAPI.update('displayCurrency', newCurrency);
      setDisplayCurrency(newCurrency);

      setNotice({ type: 'success', text: 'מטבע התצוגה עודכן בהצלחה.' });
    } catch (error) {
      console.error('Error updating currency:', error);
      setNotice({ type: 'danger', text: 'שגיאה בעדכון מטבע.' });
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (label) => {
    setNotice({ type: '', text: '' });
    setEditingLabelId(label.id);
    setDraftLabel({ id: label.id, name: label.name, color: label.color });
  };

  const cancelEdit = () => {
    setEditingLabelId(null);
    setDraftLabel({ id: '', name: '', color: '#6366f1' });
  };

  const handleUpdateLabel = async () => {
    if (!draftLabel.name.trim()) {
      setNotice({ type: 'danger', text: 'אנא הזן שם לתווית.' });
      return;
    }

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      await labelsAPI.update(draftLabel.id, {
        name: draftLabel.name.trim(),
        color: draftLabel.color,
      });

      setNotice({ type: 'success', text: 'התווית עודכנה בהצלחה.' });
      setEditingLabelId(null);
      await loadSettings();
    } catch (error) {
      console.error('Error updating label:', error);
      setNotice({ type: 'danger', text: 'שגיאה בעדכון תווית.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תווית זו?')) return;

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      await labelsAPI.delete(labelId);
      setNotice({ type: 'success', text: 'התווית נמחקה.' });

      await loadSettings();
    } catch (error) {
      console.error('Error deleting label:', error);
      setNotice({ type: 'danger', text: 'שגיאה במחיקת תווית.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabel.name.trim()) {
      setNotice({ type: 'danger', text: 'אנא הזן שם לתווית.' });
      return;
    }

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      await labelsAPI.create({
        name: newLabel.name.trim(),
        color: newLabel.color,
      });

      setNewLabel({ name: '', color: '#6366f1' });
      setNotice({ type: 'success', text: 'תווית חדשה נוצרה.' });

      await loadSettings();
    } catch (error) {
      console.error('Error creating label:', error);
      setNotice({ type: 'danger', text: 'שגיאה ביצירת תווית.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>הגדרות</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>התאם מטבע תצוגה ותוויות לניהול נוח.</p>
        </div>
      </div>

      {notice.text && (
        <div className={`notice ${notice.type === 'danger' ? 'notice--danger' : 'notice--success'}`} role="status">
          <span className="notice__icon">{notice.type === 'danger' ? '⚠️' : '✅'}</span>
          <span>{notice.text}</span>
        </div>
      )}

      {/* Currency Settings */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="section-header">
          <div>
            <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>מטבע תצוגה</h3>
            <p className="section-subtitle">
              הסיכומים יוצגו במטבע שבחרת. כל תנועה נשמרת במטבע המקורי שלה.
            </p>
          </div>
        </div>

        <div className="segmented" role="tablist" aria-label="מטבע תצוגה">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`segmented__btn ${displayCurrency === c.code ? 'is-active' : ''}`}
              onClick={() => handleCurrencyChange(c.code)}
              disabled={busy}
              aria-pressed={displayCurrency === c.code}
              title={c.name}
            >
              <span className="segmented__symbol">{c.symbol}</span>
              <span className="segmented__label">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Labels Management */}
      <div className="card">
        <div className="section-header">
          <div>
            <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>ניהול תוויות</h3>
            <p className="section-subtitle">תוויות עוזרות לסווג תנועות ולסנן מהר.</p>
          </div>
        </div>

        {/* Existing Labels */}
        {normalizedLabels.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--spacing-2xl)' }}>
            <div className="empty-state-icon">🏷️</div>
            <div className="empty-state-text">אין תוויות עדיין</div>
            <p style={{ color: 'var(--text-dim)' }}>צור תווית כדי להתחיל לסווג תנועות.</p>
          </div>
        ) : (
          <div className="list">
            {normalizedLabels.map((label) => {
              const isEditing = editingLabelId === label.id;

              return (
                <div key={label.id} className="list-item">
                  <div className="list-item__left">
                    <span className="color-dot" style={{ backgroundColor: label.color }} aria-hidden="true" />
                    {!isEditing ? (
                      <div>
                        <div className="list-item__title">{label.name}</div>
                        <div className="list-item__subtitle">{label.color}</div>
                      </div>
                    ) : (
                      <div className="inline-edit">
                        <input
                          type="text"
                          className="form-input"
                          value={draftLabel.name}
                          onChange={(e) => setDraftLabel((p) => ({ ...p, name: e.target.value }))}
                          placeholder="שם התווית"
                          disabled={busy}
                        />
                        <input
                          type="color"
                          className="form-input"
                          value={draftLabel.color}
                          onChange={(e) => setDraftLabel((p) => ({ ...p, color: e.target.value }))}
                          style={{ width: '86px' }}
                          disabled={busy}
                        />
                      </div>
                    )}
                  </div>

                  <div className="list-item__right">
                    {!isEditing ? (
                      <>
                        <button className="btn-icon" onClick={() => startEdit(label)} title="ערוך" disabled={busy}>
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteLabel(label.id)}
                          title="מחק"
                          disabled={busy}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-success" type="button" onClick={handleUpdateLabel} disabled={busy}>
                          שמור
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={cancelEdit} disabled={busy}>
                          ביטול
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Label */}
        <div className="divider" />

        <div className="section-header" style={{ marginBottom: 'var(--spacing-md)' }}>
          <div>
            <h4 style={{ margin: 0 }}>תווית חדשה</h4>
            <p className="section-subtitle" style={{ marginTop: 'var(--spacing-xs)' }}>
              בחר שם וצבע — וזהו.
            </p>
          </div>
        </div>

        <div className="create-row">
          <input
            type="text"
            className="form-input"
            placeholder="שם התווית"
            value={newLabel.name}
            onChange={(e) => setNewLabel((p) => ({ ...p, name: e.target.value }))}
            disabled={busy}
            maxLength={40}
          />
          <input
            type="color"
            className="form-input"
            value={newLabel.color}
            onChange={(e) => setNewLabel((p) => ({ ...p, color: e.target.value }))}
            style={{ width: '86px' }}
            disabled={busy}
          />
          <button className="btn btn-primary" type="button" onClick={handleCreateLabel} disabled={busy}>
            + הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
