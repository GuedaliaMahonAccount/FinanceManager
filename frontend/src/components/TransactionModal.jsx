import React, { useEffect, useMemo, useRef, useState } from 'react';
import { labelsAPI } from '../services/apiService';
import { filesToBase64, getFileIcon } from '../services/storageService';

const CURRENCIES = [
  { code: 'ILS', label: '₪ שקל' },
  { code: 'USD', label: '$ דולר' },
  { code: 'EUR', label: '€ יורו' },
];

const randomLabelColor = () => {
  const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#22c55e', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const TransactionModal = ({ labels = [], initialData = null, onClose, onSubmit }) => {
  const firstLabelId = useMemo(() => labels[0]?._id || labels[0]?.id || '', [labels]);

  const [localLabels, setLocalLabels] = useState(labels);

  const [formData, setFormData] = useState({
    type: 'expense',
    name: '',
    description: '',
    amount: '',
    currency: 'ILS',
    labelId: firstLabelId,
    date: new Date().toISOString().split('T')[0],
    receipts: [],
  });

  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState({ type: '', text: '' });
  const nameRef = useRef(null);

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  // Initialisation des données si mode édition
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'expense',
        name: initialData.name || '',
        description: initialData.description || '',
        amount: initialData.amount || '',
        currency: initialData.currency || 'ILS',
        labelId: initialData.labelId || initialData.label || firstLabelId,
        // Conversion précise de la date pour l'input date (YYYY-MM-DD)
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        receipts: initialData.receipts || [],
      });
    } else {
      // Reset defaults if no initialData (switching from edit to create if modal reused without unmounting)
      // Though typically modal unmounts.
      if (!formData.labelId && firstLabelId) {
        setFormData(prev => ({ ...prev, labelId: firstLabelId }));
      }
    }
  }, [initialData, firstLabelId]);

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

  // Logic to set default label only if not editing and labelId is empty
  useEffect(() => {
    if (!initialData && !formData.labelId && firstLabelId) {
      setFormData((p) => ({ ...p, labelId: firstLabelId }));
    }
  }, [firstLabelId, formData.labelId, initialData]);

  const amountNumber = useMemo(() => {
    const n = Number(formData.amount);
    return Number.isFinite(n) ? n : NaN;
  }, [formData.amount]);

  const canSubmit =
    !busy &&
    formData.name.trim().length >= 1 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    !!formData.date;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotice({ type: '', text: '' });
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // reset input so picking same file again triggers onChange
    e.target.value = '';

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      // soft limit
      const currentCount = formData.receipts.length;
      const maxFiles = 10;
      const allowed = files.slice(0, Math.max(0, maxFiles - currentCount));

      if (allowed.length < files.length) {
        setNotice({ type: 'danger', text: 'ניתן להעלות עד 10 קבצים. חלק מהקבצים לא נוספו.' });
      }

      const receipts = await filesToBase64(allowed);
      setFormData((prev) => ({ ...prev, receipts: [...prev.receipts, ...receipts] }));
    } catch (error) {
      console.error('Error processing files:', error);
      setNotice({ type: 'danger', text: 'שגיאה בהעלאת קבצים.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveReceipt = (index) => {
    setFormData((prev) => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index),
    }));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      setNotice({ type: 'danger', text: 'אנא הזן שם לתווית.' });
      return;
    }

    try {
      setBusy(true);
      setNotice({ type: '', text: '' });

      const created = await labelsAPI.create({
        name: newLabelName.trim(),
        color: randomLabelColor(),
      });

      const createdId = created?._id || created?.id;
      const createdName = created?.name || newLabelName.trim();
      const createdColor = created?.color || '#6366f1';

      // update local list + select immediately
      setLocalLabels((prev) => [
        ...prev,
        { ...(created || {}), _id: createdId, id: createdId, name: createdName, color: createdColor },
      ]);

      setFormData((p) => ({ ...p, labelId: createdId }));
      setNewLabelName('');
      setShowNewLabel(false);
      setNotice({ type: 'success', text: `תווית "${createdName}" נוצרה ונבחרה.` });
    } catch (error) {
      console.error('Error creating label:', error);
      setNotice({ type: 'danger', text: 'שגיאה ביצירת תווית.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice({ type: '', text: '' });

    if (!canSubmit) {
      setNotice({ type: 'danger', text: 'אנא מלא את כל השדות הנדרשים (שם + סכום + תאריך).' });
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).getTime(),
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setNotice({ type: 'danger', text: 'שגיאה ביצירת/עדכון התנועה.' });
    } finally {
      setBusy(false);
    }
  };

  const isEditMode = initialData && (initialData._id || initialData.id);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{isEditMode ? 'ערוך תנועה' : 'תנועה חדשה'}</h3>
            <p className="modal-subtitle">
              {isEditMode ? 'עדכן את פרטי התנועה' : 'צור הוצאה או הכנסה, הוסף תווית וקבצים אם צריך.'}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {notice.text && (
              <div className={`notice ${notice.type === 'danger' ? 'notice--danger' : 'notice--success'}`} role="status">
                <span className="notice__icon">{notice.type === 'danger' ? '⚠️' : '✅'}</span>
                <span>{notice.text}</span>
              </div>
            )}

            {/* Type */}
            <div className="form-group">
              <label className="form-label">סוג</label>
              <div className="radio-cards">
                <label className={`radio-card ${formData.type === 'expense' ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    disabled={busy}
                  />
                  <div className="radio-card__content">
                    <div className="radio-card__title">הוצאה</div>
                    <div className="radio-card__sub">כסף שיוצא</div>
                  </div>
                  <div className="radio-card__icon">💸</div>
                </label>

                <label className={`radio-card ${formData.type === 'income' ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={handleChange}
                    disabled={busy}
                  />
                  <div className="radio-card__content">
                    <div className="radio-card__title">הכנסה</div>
                    <div className="radio-card__sub">כסף שנכנס</div>
                  </div>
                  <div className="radio-card__icon">💰</div>
                </label>
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-name">
                שם <span className="req">*</span>
              </label>
              <input
                id="tx-name"
                ref={nameRef}
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={busy}
                placeholder="למשל: קניות / משכורת / חשמל..."
                maxLength={60}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-desc">
                תיאור <span className="muted">(אופציונלי)</span>
              </label>
              <textarea
                id="tx-desc"
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={busy}
                placeholder="פרטים נוספים..."
                maxLength={240}
              />
            </div>

            {/* Amount + Currency */}
            <div className="grid-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tx-amount">
                  סכום <span className="req">*</span>
                </label>
                <input
                  id="tx-amount"
                  type="number"
                  name="amount"
                  className="form-input"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  disabled={busy}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <div className="field-hint">
                  <span className="field-hint__text">
                    {Number.isFinite(amountNumber) && amountNumber > 0 ? 'נראה טוב.' : 'הכנס סכום גדול מ-0.'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tx-currency">
                  מטבע
                </label>
                <select
                  id="tx-currency"
                  name="currency"
                  className="form-select"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={busy}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Label */}
            <div className="form-group">
              <label className="form-label">תווית</label>

              {!showNewLabel ? (
                <div className="inline-row">
                  <select
                    name="labelId"
                    className="form-select"
                    value={formData.labelId}
                    onChange={handleChange}
                    disabled={busy || localLabels.length === 0}
                  >
                    {localLabels.map((label) => {
                      const id = label._id || label.id;
                      return (
                        <option key={id} value={id}>
                          {label.name}
                        </option>
                      );
                    })}
                  </select>

                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewLabel(true)} disabled={busy}>
                    + חדש
                  </button>
                </div>
              ) : (
                <div className="inline-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="שם התווית החדשה"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    disabled={busy}
                    maxLength={40}
                  />
                  <button type="button" className="btn btn-success" onClick={handleCreateLabel} disabled={busy}>
                    צור
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewLabel(false)} disabled={busy}>
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-date">
                תאריך <span className="req">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={busy}
              />
            </div>

            {/* Receipts */}
            <div className="form-group">
              <label className="form-label">קבלות וקבצים</label>

              <div className="file-drop">
                <input
                  type="file"
                  className="form-input"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  disabled={busy}
                />
                <div className="file-drop__hint">
                  עד 10 קבצים. תמונות / PDF / Word / Excel.
                </div>
              </div>

              {formData.receipts.length > 0 && (
                <div className="file-chips">
                  {formData.receipts.map((receipt, index) => (
                    <div key={`${receipt.name}-${index}`} className="file-chip">
                      <span className="file-chip__icon" aria-hidden="true">
                        {getFileIcon ? getFileIcon(receipt.name) : '📎'}
                      </span>
                      <span className="file-chip__name" title={receipt.name}>
                        {receipt.name}
                      </span>
                      <button
                        type="button"
                        className="file-chip__x"
                        onClick={() => handleRemoveReceipt(index)}
                        aria-label="הסר קובץ"
                        disabled={busy}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer modal-footer--spread">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
              ביטול
            </button>

            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {busy ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  שומר...
                </>
              ) : (
                <>
                  <span>{isEditMode ? '✏️' : '➕'}</span>
                  {isEditMode ? 'עדכן תנועה' : 'צור תנועה'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
