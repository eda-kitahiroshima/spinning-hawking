import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppGrid from '../components/AppGrid';
import API_BASE_URL from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!token || !userId) {
            navigate('/login', { state: { message: 'ダッシュボードにアクセスするにはログインが必要です。' } });
            return;
        }
        setUser({ username, id: userId });
    }, [navigate, token, userId, username]);

    if (!user) return null;

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={styles.header}>
                <h1 style={styles.title}>マイダッシュボード</h1>
                <p style={styles.subtitle}>{user.username} さんの投稿アプリ一覧</p>
            </div>

            <div style={styles.content}>
                <AppGrid
                    fetchUrl={`${API_BASE_URL}/api/apps/user/${user.id}`}
                    showControls={true}
                    token={token}
                    onEdit={(appId) => navigate(`/edit/${appId}`)}
                />
            </div>
        </div>
    );
};

const styles = {
    header: {
        textAlign: 'center',
        marginBottom: '3rem',
    },
    title: {
        fontSize: '2.5rem',
        marginBottom: '1rem',
        background: 'var(--primary-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: 'var(--text-secondary)',
    },
    content: {
        minHeight: '400px',
    }
};

export default Dashboard;
