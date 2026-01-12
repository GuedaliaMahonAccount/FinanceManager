import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'הרשמה נכשלה');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: 'var(--spacing-2xl)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div className="logo" style={{ justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>מנהל הכספים שלי</div>
                    <h2>הרשמה</h2>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-danger)',
                        color: 'var(--color-danger)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-lg)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">שם מלא</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input"
                            placeholder="ישראל ישראלי"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">אימייל</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            dir="ltr"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">סיסמה</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            dir="ltr"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
                        הרשם
                    </button>

                    <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        כבר רשום? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' }}>התחבר כאן</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
