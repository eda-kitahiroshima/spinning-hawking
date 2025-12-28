import React, { useState, useEffect } from 'react';
import AppCard from './AppCard';
import { apiFetch, API_BASE_URL } from '../lib/api';

const AppGrid = ({ fetchUrl = `/api/apps`, showControls = false, token = null, onEdit }) => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token} `;
                }

                // fetchUrl might be full URL from older parent components
                let path = fetchUrl;
                if (API_BASE_URL && path.startsWith(API_BASE_URL)) {
                    path = path.replace(API_BASE_URL, '');
                }

                const data = await apiFetch(path, { headers });
                setApps(data);
            } catch (error) {
                console.error("Failed to fetch apps:", error);
                setApps([]);
            } finally {
                setLoading(false);
            }
        };

        fetchApps();
    }, [fetchUrl, token]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading apps...</div>;
    }

    const handleDelete = (id) => {
        setApps(prevApps => prevApps.filter(app => app.id !== id));
    };

    return (
        <div style={styles.grid}>
            {apps.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    表示するアプリケーションがありません。
                </div>
            ) : (
                apps.map(app => (
                    <AppCard key={app.id} app={app} onDelete={handleDelete} showControls={showControls} onEdit={onEdit} />
                ))
            )}
        </div>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        padding: '2rem 0',
    }
};

export default AppGrid;
