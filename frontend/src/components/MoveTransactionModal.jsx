import React, { useState } from 'react';

const MoveTransactionModal = ({ transaction, projects, currentProjectId, onClose, onMove }) => {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState({ type: '', text: '' });

    // Filter out the current project
    const availableProjects = projects.filter(p => (p._id || p.id) !== currentProjectId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotice({ type: '', text: '' });

        if (!selectedProjectId) {
            setNotice({ type: 'danger', text: 'אנא בחר פרויקט יעד' });
            return;
        }

        setBusy(true);
        try {
            await onMove(selectedProjectId);
        } catch (error) {
            console.error('Error moving transaction:', error);
            setNotice({ type: 'danger', text: 'שגיאה בהעברת התנועה: ' + error.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">העבר תנועה לפרויקט אחר</h3>
                        <p className="modal-subtitle">
                            העבר את "{transaction.name}" לפרויקט אחר
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

                        {availableProjects.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📁</div>
                                <div className="empty-state-text">
                                    אין פרויקטים אחרים זמינים
                                </div>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label" htmlFor="target-project">
                                    בחר פרויקט יעד <span className="req">*</span>
                                </label>
                                <select
                                    id="target-project"
                                    className="form-select"
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    disabled={busy}
                                    required
                                >
                                    <option value="">-- בחר פרויקט --</option>
                                    {availableProjects.map(project => (
                                        <option key={project._id || project.id} value={project._id || project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer modal-footer--spread">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
                            ביטול
                        </button>

                        {availableProjects.length > 0 && (
                            <button type="submit" className="btn btn-primary" disabled={!selectedProjectId || busy}>
                                {busy ? (
                                    <>
                                        <span className="btn-spinner" aria-hidden="true" />
                                        מעביר...
                                    </>
                                ) : (
                                    <>
                                        <span>🔄</span>
                                        העבר תנועה
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoveTransactionModal;
