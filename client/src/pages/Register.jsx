import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('パスワードが一致しません。');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL} /api/auth / register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '登録に失敗しました。');
            }

            // 成功したらログイン画面へ
            navigate('/login', { state: { message: '登録が完了しました。ログインしてください。' } });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>アカウント<span className="gradient-text">登録</span></h1>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label htmlFor="username" style={styles.label}>ユーザー名</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="password" style={styles.label}>パスワード</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="confirmPassword" style={styles.label}>パスワード（確認）</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.submitButton}>
                        登録
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                        すでにアカウントをお持ちですか？ <Link to="/login" style={{ color: '#a29bfe' }}>ログイン</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

const styles = {
    formContainer: {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--surface-color)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    title: {
        textAlign: 'center',
        fontSize: '1.8rem',
        marginBottom: '2rem',
        fontWeight: '700',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
    },
    input: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
    },
    error: {
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        color: '#e74c3c',
        padding: '0.75rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        textAlign: 'center',
        fontSize: '0.9rem',
    },
    submitButton: {
        marginTop: '0.5rem',
        padding: '0.8rem',
        background: 'var(--primary-gradient)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
    }
};

export default Register;
