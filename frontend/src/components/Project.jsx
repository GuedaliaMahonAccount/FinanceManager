import React, { useState, useEffect } from 'react';
import { projectsAPI, transactionsAPI, labelsAPI, settingsAPI, subscriptionsAPI } from '../services/apiService';
import { convertCurrency, formatCurrency } from '../services/currencyService';
import { downloadFile, getFileIcon } from '../services/storageService';
import TransactionModal from './TransactionModal';
import SubscriptionModal from './SubscriptionModal';

const Project = ({ projectId, onNavigate }) => {
    const [project, setProject] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
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
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);

    useEffect(() => {
        loadData();
    }, [projectId]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, selectedYear, selectedLabel, selectedType]);

    useEffect(() => {
        if (filteredTransactions.length > 0 || transactions.length > 0 || subscriptions.length > 0) {
            calculateStats();
            checkNotifications();
        }
    }, [filteredTransactions, displayCurrency, subscriptions, transactions]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [projectData, transactionsData, labelsData, settingsData, subscriptionsData] = await Promise.all([
                projectsAPI.getById(projectId),
                transactionsAPI.getByProject(projectId),
                labelsAPI.getAll(),
                settingsAPI.getAll(),
                subscriptionsAPI.getByProject(projectId)
            ]);

            setProject(projectData);
            const sortedTransactions = transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sortedTransactions);
            setSubscriptions(subscriptionsData || []);
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

        // Calculate from transactions
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

    const checkNotifications = () => {
        const newNotifications = [];
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        subscriptions.forEach(sub => {
            const startDate = new Date(sub.startDate);
            let checkDate = new Date(startDate);

            // Only check active subscriptions that started in the past
            if (checkDate > now) return;

            // Iterate through expected payment dates
            while (checkDate <= now) {
                const checkYear = checkDate.getFullYear();
                const checkMonth = checkDate.getMonth();

                // We only care about "recent" missing payments (e.g., this year) to avoid spam
                if (checkYear === currentYear) {
                    // Check if there is a transaction for this subscription around this date
                    const hasPayment = transactions.some(t => {
                        if (t.subscriptionId === (sub._id || sub.id)) {
                            const tDate = new Date(t.date);
                            // Match if same month and year (for monthly) or same year (for yearly)
                            if (sub.frequencyUnit === 'months') {
                                return tDate.getMonth() === checkMonth && tDate.getFullYear() === checkYear;
                            } else if (sub.frequencyUnit === 'years') {
                                return tDate.getFullYear() === checkYear;
                            }
                            // For days/weeks, tighter check logic might be needed, but simple overlap is okay for now
                            return Math.abs(tDate - checkDate) < 7 * 24 * 60 * 60 * 1000; // Within a week
                        }
                        return false;
                    });

                    if (!hasPayment) {
                        newNotifications.push({
                            subscription: sub,
                            dueDate: new Date(checkDate),
                            id: `${sub._id}-${checkDate.getTime()}`
                        });
                    }
                }

                // Increment checkDate
                if (sub.frequencyUnit === 'days') checkDate.setDate(checkDate.getDate() + sub.frequencyValue);
                else if (sub.frequencyUnit === 'weeks') checkDate.setDate(checkDate.getDate() + (sub.frequencyValue * 7));
                else if (sub.frequencyUnit === 'months') checkDate.setMonth(checkDate.getMonth() + sub.frequencyValue);
                else if (sub.frequencyUnit === 'years') checkDate.setFullYear(checkDate.getFullYear() + sub.frequencyValue);
            }
        });

        // Sort notifications by date (newest first) and limit to avoid clutter
        setNotifications(newNotifications.sort((a, b) => b.dueDate - a.dueDate));
    };

    const handlePayNotification = (notification) => {
        const { subscription, dueDate } = notification;

        setEditingTransaction({
            projectId,
            name: subscription.name,
            description: `תשלום עבור לתקופת ${dueDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`,
            amount: subscription.amount,
            currency: subscription.currency,
            date: dueDate.toISOString().split('T')[0],
            type: 'expense',
            subscriptionId: subscription._id || subscription.id
        });
        setShowTransactionModal(true);
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

    const handleSaveSubscription = async (subscriptionData) => {
        try {
            if (editingSubscription) {
                await subscriptionsAPI.update(editingSubscription._id || editingSubscription.id, subscriptionData);
            } else {
                await subscriptionsAPI.create(subscriptionData);
            }
            setShowSubscriptionModal(false);
            setEditingSubscription(null);
            loadData();
        } catch (error) {
            console.error('Error saving subscription:', error);
            alert('שגיאה בשמירת המנוי: ' + error.message);
        }
    };

    const handleDeleteSubscription = async (subscriptionId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק מנוי זה?')) return;

        try {
            await subscriptionsAPI.delete(subscriptionId);
            loadData();
        } catch (error) {
            console.error('Error deleting subscription:', error);
            alert('שגיאה במחיקת המנוי: ' + error.message);
        }
    };

    const handleEditSubscription = (subscription) => {
        setEditingSubscription(subscription);
        setShowSubscriptionModal(true);
    };

    const handleSubscriptionModalClose = () => {
        setShowSubscriptionModal(false);
        setEditingSubscription(null);
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
                        setEditingSubscription(null);
                        setShowSubscriptionModal(true);
                    }}
                    style={{ marginLeft: 'var(--spacing-sm)' }}
                >
                    <span>🔄</span>
                    מנוי חדש
                </button>
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

                {/* Notifications Section */}
                {notifications.length > 0 && (
                    <div style={{ marginBottom: '20px', background: '#fff3cd', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ תשלומים ממתינים</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notifications.map(notif => (
                                <div key={notif.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '4px' }}>
                                    <div>
                                        <strong>{notif.subscription.name}</strong> - {notif.dueDate.toLocaleDateString('he-IL')}
                                    </div>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handlePayNotification(notif)}
                                    >
                                        שילמתי / הוסף חשבונית
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Subscriptions List (Pinned) */}
                {subscriptions.length > 0 && (
                    <div className="subscriptions-section" style={{ marginBottom: '20px', borderBottom: '2px dashed var(--border-color)', paddingBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-primary)' }}>🔄 מנויים ותשלומים קבועים</h4>
                        {subscriptions.map(sub => (
                            <div key={sub._id || sub.id} className="transaction-item subscription-item" style={{ background: 'var(--bg-subtle)' }}>
                                <div className="transaction-info">
                                    <div className="transaction-name">{sub.name} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(פעיל)</span></div>
                                    <div className="transaction-meta">
                                        <span>החל מ: {new Date(sub.startDate).toLocaleDateString('he-IL')}</span>
                                        <span> • כל {sub.frequencyValue} {
                                            sub.frequencyUnit === 'days' ? 'ימים' :
                                                sub.frequencyUnit === 'weeks' ? 'שבועות' :
                                                    sub.frequencyUnit === 'months' ? 'חודשים' : 'שנים'
                                        }</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div className="transaction-amount expense">
                                        -{formatCurrency(sub.amount, sub.currency)}
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                        <button className="btn-icon" onClick={() => handleEditSubscription(sub)}>✏️</button>
                                        <button className="btn-icon" onClick={() => handleDeleteSubscription(sub._id || sub.id)} style={{ color: 'var(--color-danger)' }}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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

            {/* Subscription Modal */}
            {showSubscriptionModal && (
                <SubscriptionModal
                    initialData={editingSubscription}
                    projectId={projectId}
                    onClose={handleSubscriptionModalClose}
                    onSuccess={handleSaveSubscription}
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