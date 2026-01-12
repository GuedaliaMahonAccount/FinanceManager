import React, { useEffect, useMemo, useRef, useState } from 'react';
import { projectsAPI } from '../services/apiService';

const ProjectModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const nameError = useMemo(() => {
    if (!touched.name) return '';
    if (!formData.name.trim()) return 'שם הפרויקט הוא שדה חובה';
    if (formData.name.trim().length < 2) return 'שם הפרויקט חייב להכיל לפחות 2 תווים';
    return '';
  }, [formData.name, touched.name]);

  const canSubmit = !loading && !nameError && formData.name.trim().length >= 2;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setSuccessMsg('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true });
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim() || formData.name.trim().length < 2) return;

    setLoading(true);
    try {
      await projectsAPI.create({
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
      });

      setSuccessMsg('הפרויקט נוצר בהצלחה!');
      // Petite pause UI? Pas besoin; onSuccess va naviguer / refresh
      onSuccess?.();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('שגיאה ביצירת פרויקט. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal modal--md" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">פרויקט חדש</h3>
            <p className="modal-subtitle">הוסף שם ותיאור קצר כדי להתחיל לעקוב אחרי ההכנסות/הוצאות.</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {(error || successMsg) && (
              <div className={`notice ${error ? 'notice--danger' : 'notice--success'}`} role="status" aria-live="polite">
                <span className="notice__icon">{error ? '⚠️' : '✅'}</span>
                <span>{error || successMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="project-name">
                שם הפרויקט <span className="req">*</span>
              </label>
              <input
                id="project-name"
                ref={nameRef}
                type="text"
                name="name"
                className={`form-input ${nameError ? 'is-invalid' : ''}`}
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="לדוגמה: חופשה בחו״ל, שיפוץ בית"
                required
                maxLength={60}
                autoComplete="off"
              />
              <div className="field-hint">
                <span className="field-hint__text">{nameError || 'תן לפרויקט שם קצר וברור.'}</span>
                <span className="field-hint__counter">{formData.name.trim().length}/60</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="project-desc">
                תיאור <span className="muted">(אופציונלי)</span>
              </label>
              <textarea
                id="project-desc"
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="תיאור קצר של הפרויקט"
                rows={4}
                maxLength={220}
              />
              <div className="field-hint">
                <span className="field-hint__text">אפשר להוסיף קצת הקשר כדי לזכור במה מדובר.</span>
                <span className="field-hint__counter">{(formData.description || '').length}/220</span>
              </div>
            </div>

          </div>

          <div className="modal-footer modal-footer--spread">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              ביטול
            </button>

            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {loading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  יוצר...
                </>
              ) : (
                <>
                  <span>➕</span>
                  צור פרויקט
                </>
              )}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
};

export default ProjectModal;
