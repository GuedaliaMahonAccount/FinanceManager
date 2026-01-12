import React, { useEffect, useState } from 'react';

const SubscriptionModal = ({ onClose, onSuccess, initialData, projectId }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        currency: 'ILS',
        startDate: new Date().toISOString().split('T')[0],
        frequencyValue: 1,
        frequencyUnit: 'months'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startDate: new Date(initialData.startDate).toISOString().split('T')[0]
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSuccess({
                ...formData,
                projectId,
                amount: Number(formData.amount),
                frequencyValue: Number(formData.frequencyValue)
            });
            onClose();
        } catch (err) {
            console.error('Error saving subscription:', err);
            setError('שגיאה בשמירת המנוי');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div className="modal" onClick={e => e.stopPropagation()} role="dialog">
                <div className="modal-header">
                    <h3 className="modal-title">{initialData ? 'עריכת מנוי' : 'הוספת מנוי חדש'}</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="notice notice--danger">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">שם המנוי</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="לדוגמה: נטפליקס"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">תיאור (אופציונלי)</label>
                        <input
                            type="text"
                            name="description"
                            className="form-input"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">סכום</label>
                            <input
                                type="number"
                                name="amount"
                                className="form-input"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">מטבע</label>
                            <select
                                name="currency"
                                className="form-select"
                                value={formData.currency}
                                onChange={handleChange}
                            >
                                <option value="ILS">₪ (ILS)</option>
                                <option value="USD">$ (USD)</option>
                                <option value="EUR">€ (EUR)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">תאריך התחלה</label>
                        <input
                            type="date"
                            name="startDate"
                            className="form-input"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">תדירות תשלום</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span>כל</span>
                            <input
                                type="number"
                                name="frequencyValue"
                                className="form-input"
                                style={{ width: '80px' }}
                                value={formData.frequencyValue}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                            <select
                                name="frequencyUnit"
                                className="form-select"
                                value={formData.frequencyUnit}
                                onChange={handleChange}
                            >
                                <option value="days">ימים</option>
                                <option value="weeks">שבועות</option>
                                <option value="months">חודשים</option>
                                <option value="years">שנים</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            ביטול
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'שומר...' : (initialData ? 'עדכון מנוי' : 'הוספת מנוי')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionModal;
