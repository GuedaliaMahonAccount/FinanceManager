import React, { useState, useEffect } from 'react';
import { projectsAPI, transactionsAPI, labelsAPI, settingsAPI } from '../services/apiService';
import { convertCurrency, formatCurrency } from '../services/currencyService';
import { downloadFile, getFileIcon } from '../services/storageService';
import TransactionModal from './TransactionModal';

const Project = ({ projectId, onNavigate }) => {
    const [project, setProject] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [stats, setStats] = useState({ income: 0, expenses: 0, total: 0 });
    const [displayCurrency, setDisplayCurrency] = useState('ILS');
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedLabel, setSelectedLabel] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    // Modal
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        loadData();
    }, [projectId]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, selectedYear, selectedLabel, selectedType]);

    useEffect(() => {
        if (filteredTransactions.length > 0 || transactions.length > 0) {
            calculateStats();
        }
    }, [filteredTransactions, displayCurrency]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [projectData, transactionsData, labelsData, settingsData] = await Promise.all([
                projectsAPI.getById(projectId),
                transactionsAPI.getByProject(projectId),
                labelsAPI.getAll(),
                settingsAPI.getAll()
            ]);

            setProject(projectData);
            const sortedTransactions = transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sortedTransactions);
            setLabels(labelsData);
            setDisplayCurrency(settingsData.displayCurrency || 'ILS');
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async () => {
        let income = 0;
        let expenses = 0;

        const transactionsToCalculate = filteredTransactions.length > 0 ? filteredTransactions : transactions;

        for (const transaction of transactionsToCalculate) {
            const convertedAmount = await convertCurrency(
                transaction.amount,
                transaction.currency,
                displayCurrency,
                transaction.date
            );

            if (transaction.type === 'income') {
                income += convertedAmount;
            } else {
                expenses += convertedAmount;
            }
        }

        setStats({
            income,
            expenses,
            total: income - expenses
        });
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedYear !== 'all') {
            filtered = filtered.filter(t => {
                const year = new Date(t.date).getFullYear();
                return year === parseInt(selectedYear);
            });
        }

        if (selectedLabel !== 'all') {
            filtered = filtered.filter(t => t.labelId === selectedLabel);
        }

        if (selectedType !== 'all') {
            filtered = filtered.filter(t => t.type === selectedType);
        }

        setFilteredTransactions(filtered);
    };

    const handleSaveTransaction = async (transactionData) => {
        try {
            if (editingTransaction) {
                // Update existing
                await transactionsAPI.update(editingTransaction._id || editingTransaction.id, {
                    ...transactionData,
                    projectId
                });
            } else {
                // Create new
                await transactionsAPI.create({
                    ...transactionData,
                    projectId
                });
            }
            setShowTransactionModal(false);
            setEditingTransaction(null);
            loadData();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('שגיאה בשמירת התנועה: ' + error.message);
        }
    };

    const handleEditClick = (transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };

    const handleModalClose = () => {
        setShowTransactionModal(false);
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) return;

        try {
            await transactionsAPI.delete(transactionId);
            loadData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('שגיאה במחיקת התנועה: ' + error.message);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedYear('all');
        setSelectedLabel('all');
        setSelectedType('all');
    };

    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
    const hasActiveFilters = searchTerm || selectedYear !== 'all' || selectedLabel !== 'all' || selectedType !== 'all';

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <div className="empty-state-text">הפרויקט לא נמצא</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="card-header">
                <div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => onNavigate('dashboard')}
                        style={{ marginLeft: 'var(--spacing-md)' }}
                    >
                        ← חזרה
                    </button>
                    <h1 style={{ display: 'inline', marginRight: 'var(--spacing-md)' }}>{project.name}</h1>
                    {project.description && (
                        <p style={{
                            color: 'var(--text-muted)',
                            marginTop: 'var(--spacing-sm)',
                            fontSize: '1rem'
                        }}>
                            {project.description}
                        </p>
                    )}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingTransaction(null);
                        setShowTransactionModal(true);
                    }}
                >
                    <span>➕</span>
                    תנועה חדשה
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-3xl)' }}>
                <div className="stats-card success">
                    <div className="stats-icon">💰</div>
                    <div className="stats-label">הכנסות</div>
                    <div className="stats-value">{formatCurrency(stats.income, displayCurrency)}</div>
                </div>
                <div className="stats-card danger">
                    <div className="stats-icon">💸</div>
                    <div className="stats-label">הוצאות</div>
                    <div className="stats-value">{formatCurrency(stats.expenses, displayCurrency)}</div>
                </div>
                <div className="stats-card">
                    <div className="stats-icon">📊</div>
                    <div className="stats-label">יתרה</div>
                    <div
                        className="stats-value"
                        style={{ color: stats.total >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                    >
                        {formatCurrency(stats.total, displayCurrency)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <h3 style={{ margin: 0 }}>סינון תנועות</h3>
                    {hasActiveFilters && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleClearFilters}
                            style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                        >
                            🗑️ נקה סינונים
                        </button>
                    )}
                </div>

                <div className="filters">
                    <div className="filter-group">
                        <label className="form-label">חיפוש</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="חפש לפי שם או תיאור..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="form-label">שנה</label>
                        <select
                            className="form-select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="all">כל השנים</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="form-label">תווית</label>
                        <select
                            className="form-select"
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                        >
                            <option value="all">כל התוויות</option>
                            {labels.map(label => (
                                <option key={label._id || label.id} value={label._id || label.id}>
                                    {label.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="form-label">סוג</label>
                        <select
                            className="form-select"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">הכל</option>
                            <option value="income">הכנסות</option>
                            <option value="expense">הוצאות</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="card">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <h3 style={{ margin: 0 }}>תנועות</h3>
                    <span className="badge badge-primary">
                        {filteredTransactions.length} {filteredTransactions.length === 1 ? 'תנועה' : 'תנועות'}
                    </span>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {hasActiveFilters ? '🔍' : '💸'}
                        </div>
                        <div className="empty-state-text">
                            {hasActiveFilters ? 'לא נמצאו תנועות התואמות לסינון' : 'אין תנועות להצגה'}
                        </div>
                        {hasActiveFilters && (
                            <button className="btn btn-secondary" onClick={handleClearFilters}>
                                נקה סינונים
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredTransactions.map((transaction, index) => {
                            const currentYear = new Date(transaction.date).getFullYear();
                            const previousYear = index > 0 ? new Date(filteredTransactions[index - 1].date).getFullYear() : null;
                            const showYearSeparator = index === 0 || currentYear !== previousYear;

                            return (
                                <React.Fragment key={transaction._id || transaction.id}>
                                    {showYearSeparator && (
                                        <div className="year-separator">
                                            <span>{currentYear}</span>
                                        </div>
                                    )}
                                    <TransactionItem
                                        transaction={transaction}
                                        labels={labels}
                                        displayCurrency={displayCurrency}
                                        onDelete={handleDeleteTransaction}
                                        onEdit={handleEditClick}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <TransactionModal
                    labels={labels}
                    initialData={editingTransaction}
                    onClose={handleModalClose}
                    onSubmit={handleSaveTransaction}
                />
            )}
        </div>
    );
};

const TransactionItem = ({ transaction, labels, displayCurrency, onDelete, onEdit }) => {
    const [convertedAmount, setConvertedAmount] = useState(transaction.amount);
    const [showDetails, setShowDetails] = useState(false);
    const label = labels.find(l => (l._id || l.id) === (transaction.labelId || transaction.label));

    useEffect(() => {
        if (transaction.currency !== displayCurrency) {
            convertCurrency(transaction.amount, transaction.currency, displayCurrency, transaction.date)
                .then(setConvertedAmount);
        }
    }, [transaction, displayCurrency]);

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="transaction-item">
            <div className="transaction-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                    <div className="transaction-name">{transaction.name}</div>
                    {label && (
                        <span
                            className="badge"
                            style={{
                                backgroundColor: label.color + '20',
                                color: label.color,
                                borderColor: label.color
                            }}
                        >
                            {label.name}
                        </span>
                    )}
                </div>

                <div className="transaction-meta">
                    <span>📅 {formatDate(transaction.date)}</span>
                    {transaction.receipts && transaction.receipts.length > 0 && (
                        <span>📎 {transaction.receipts.length} {transaction.receipts.length === 1 ? 'קובץ' : 'קבצים'}</span>
                    )}
                </div>

                {transaction.description && (
                    <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        marginTop: 'var(--spacing-sm)',
                        lineHeight: '1.6'
                    }}>
                        {transaction.description}
                    </div>
                )}

                {transaction.receipts && transaction.receipts.length > 0 && showDetails && (
                    <div style={{
                        marginTop: 'var(--spacing-md)',
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        flexWrap: 'wrap'
                    }}>
                        {transaction.receipts.map((receipt, index) => (
                            <button
                                key={index}
                                className="btn-icon"
                                onClick={() => downloadFile(receipt.data, receipt.name)}
                                title={`הורד ${receipt.name}`}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)'
                                }}
                            >
                                {getFileIcon(receipt.name)}
                                <span>{receipt.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <div style={{ textAlign: 'left' }}>
                    <div className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    {transaction.currency !== displayCurrency && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            marginTop: 'var(--spacing-xs)'
                        }}>
                            ≈ {formatCurrency(convertedAmount, displayCurrency)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    {transaction.receipts && transaction.receipts.length > 0 && (
                        <button
                            className="btn-icon"
                            onClick={() => setShowDetails(!showDetails)}
                            title={showDetails ? 'הסתר פרטים' : 'הצג פרטים'}
                        >
                            {showDetails ? '🔼' : '🔽'}
                        </button>
                    )}
                    <button
                        className="btn-icon"
                        onClick={() => onEdit(transaction)}
                        title="ערוך"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        ✏️
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => onDelete(transaction._id || transaction.id)}
                        title="מחק"
                        style={{ color: 'var(--color-danger)' }}
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Project;