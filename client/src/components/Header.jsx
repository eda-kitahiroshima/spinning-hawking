import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleHomeClick = (e) => {
        e.preventDefault();
        navigate('/', { replace: true });
        window.location.href = '/'; // Force full page reload to clear all state
    };

    return (
        <header style={styles.header}>
            <div className="container" style={styles.inner}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 style={styles.logo}>
                        APP <span className="gradient-text">Studio</span>
                    </h1>
                </Link>
                <nav style={styles.nav}>
                    {user ? (
                        <>
                            <span style={styles.username}>Hello, {user.username}</span>
                            <a href="/" onClick={handleHomeClick} style={styles.link}>ホーム</a>
                            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                            <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
                        </>
                    ) : (
                        <>
                            <a href="/" onClick={handleHomeClick} style={styles.link}>ホーム</a>
                            <Link to="/login" style={styles.link}>Login</Link>
                            <Link to="/register" style={styles.registerButton}>Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

const styles = {
    header: {
        padding: '2rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(12, 12, 14, 0.8)',
        borderBottom: '1px solid var(--border-color)',
    },
    inner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    link: {
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'color 0.2s',
    },
    registerButton: {
        padding: '0.5rem 1rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'background 0.2s',
    },
    logoutButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'color 0.2s',
    },
    username: {
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        fontWeight: '600',
    }
};

export default Header;
