import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const SubmitApp = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        downloadUrl: '',
        tags: '',
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (location.state) {
            const { name, description, downloadUrl, tags } = location.state;
            setFormData(prev => ({
                ...prev,
                name: name || '',
                description: description || '',
                downloadUrl: downloadUrl || '',
                tags: tags || ''
            }));
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!userId) {
            setError('ユーザーIDが見つかりません。再読み込みしてください。');
            setSubmitting(false);
            return;
        }

        // Process tags from comma-separated string to array
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        try {
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('description', formData.description);
            formDataObj.append('downloadUrl', formData.downloadUrl);
            formDataObj.append('tags', JSON.stringify(tagsArray));
            formDataObj.append('userId', userId);

            if (file) {
                formDataObj.append('screenshot', file);
            }

            const response = await fetch(`${API_BASE_URL}/api/apps`, {
                method: 'POST',
                body: formDataObj,
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || 'アプリケーションの登録に失敗しました');
                } catch (e) {
                    // Fallback if not JSON
                    if (e.message !== 'アプリケーションの登録に失敗しました' && !text.trim().startsWith('{')) {
                        console.error('Non-JSON error response:', text);
                        throw new Error(`サーバーエラー(HTML): ${text.replace(/<[^>]*>?/gm, '').slice(0, 100)}...`);
                    }
                    throw e;
                }
            }

            // Success
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>アプリケーションを<span className="gradient-text">投稿</span></h1>
                <p style={styles.subtitle}>あなたの作品を世界と共有しましょう。</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label htmlFor="name" style={styles.label}>アプリケーション名</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="例: TaskMaster Pro"
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="downloadUrl" style={styles.label}>ダウンロードURL</label>
                        <input
                            type="url"
                            id="downloadUrl"
                            name="downloadUrl"
                            value={formData.downloadUrl}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="例: https://github.com/user/repo/releases/..."
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="screenshot" style={styles.label}>画像 (スクリーンショット等)</label>
                        <input
                            type="file"
                            id="screenshot"
                            name="screenshot"
                            onChange={handleFileChange}
                            style={{ ...styles.input, paddingTop: '0.5rem' }}
                            accept="image/*"
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="description" style={styles.label}>説明</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={styles.textarea}
                            placeholder="アプリの内容や特徴を説明してください..."
                            required
                            rows="5"
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="tags" style={styles.label}>タグ <span style={styles.hint}>(カンマ区切り)</span></label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="例: 仕事効率化, React, ツール"
                        />
                    </div>

                    <button type="submit" style={styles.submitButton} disabled={submitting}>
                        {submitting ? '送信中...' : 'アプリを登録'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    formContainer: {
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'var(--surface-color)',
        padding: '3rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    title: {
        textAlign: 'center',
        fontSize: '2rem',
        marginBottom: '0.5rem',
        fontWeight: '700',
    },
    subtitle: {
        textAlign: 'center',
        color: 'var(--text-secondary)',
        marginBottom: '2.5rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
    },
    hint: {
        fontWeight: '400',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
    },
    input: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    textarea: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
    },
    error: {
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        color: '#e74c3c',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        textAlign: 'center',
        fontSize: '0.9rem',
    },
    submitButton: {
        marginTop: '1rem',
        padding: '1rem',
        background: 'var(--primary-gradient)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s, opacity 0.2s',
    }
};

export default SubmitApp;
