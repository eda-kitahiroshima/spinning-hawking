import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import API_BASE_URL from '../config';
import API_BASE_URL from '../config';

const EditApp = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        downloadUrl: '',
        tags: '',
        screenshotUrl: '', // For display only
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch existing data
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/apps/${id}`);
                if (!response.ok) {
                    throw new Error('アプリが見つかりませんでした');
                }
                const app = await response.json();

                // Parse tags to string
                let tagsStr = '';
                if (Array.isArray(app.tags)) {
                    tagsStr = app.tags.join(', ');
                }

                setFormData({
                    name: app.name,
                    description: app.description,
                    downloadUrl: app.downloadUrl,
                    tags: tagsStr,
                    screenshotUrl: app.screenshotUrl,
                    code: app.code // Add code field
                });
            } catch (err) {
                console.error(err);
                setError('データの取得に失敗しました。');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

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

        if (!userId || !token) {
            setError('ログインが必要です。');
            setSubmitting(false);
            return;
        }

        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        try {
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('description', formData.description);
            formDataObj.append('downloadUrl', formData.downloadUrl);
            formDataObj.append('tags', JSON.stringify(tagsArray));
            // No userId needed for update usually, auth token handles identity check

            if (file) {
                formDataObj.append('screenshot', file);
            } else {
                // If no file, backend might need to know to keep existing or maybe we send existing URL?
                // Backend logic we wrote checks: req.file OR body.screenshotUrl OR row.screenshotUrl.
                // Sending body.screenshotUrl is safe.
                formDataObj.append('screenshotUrl', formData.screenshotUrl);
            }

            const response = await fetch(`${API_BASE_URL}/api/apps/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataObj,
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || '更新に失敗しました');
                } catch (e) {
                    if (e.message !== '更新に失敗しました' && !text.trim().startsWith('{')) {
                        throw new Error(`サーバーエラー: ${text.replace(/<[^>]*>?/gm, '').slice(0, 50)}...`);
                    }
                    throw e;
                }
            }

            // Success: go back to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', color: 'white' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>アプリケーションを<span className="gradient-text">編集</span></h1>

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
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="screenshot" style={styles.label}>画像 (変更する場合のみ選択)</label>
                        <input
                            type="file"
                            id="screenshot"
                            name="screenshot"
                            onChange={handleFileChange}
                            style={{ ...styles.input, paddingTop: '0.5rem' }}
                            accept="image/*"
                        />
                        {formData.screenshotUrl && !file && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                現在の画像: {formData.screenshotUrl.split('/').pop()}
                            </p>
                        )}
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="description" style={styles.label}>説明</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={styles.textarea}
                            required
                            rows="5"
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="tags" style={styles.label}>タグ (カンマ区切り)</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label htmlFor="code" style={styles.label}>ソースコード (上級者向け)</label>
                        <textarea
                            id="code"
                            name="code"
                            value={formData.code || ''}
                            onChange={handleChange}
                            style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: '0.9rem', minHeight: '300px', whiteSpace: 'pre' }}
                            rows="10"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => navigate('/dashboard')} style={{ ...styles.submitButton, background: 'transparent', border: '1px solid var(--border-color)', marginTop: 0 }}>
                            キャンセル
                        </button>
                        <button type="submit" style={{ ...styles.submitButton, flex: 2, marginTop: 0 }} disabled={submitting}>
                            {submitting ? '更新中...' : '変更を保存'}
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            AIを使ってこのアプリを改良したり、不具合を修正したりできます。
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/create-app', {
                                state: {
                                    initialCode: formData.code,
                                    initialPrompt: `【アプリの改良】\n現在のアプリ「${formData.name}」をベースに、さらに良くしてください。\n\n要望:\n`,
                                    originAppId: id,
                                    existingMetadata: {
                                        name: formData.name,
                                        description: formData.description,
                                        tags: formData.tags
                                    }
                                }
                            })}
                            style={{
                                ...styles.submitButton,
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                width: '100%',
                                marginTop: 0
                            }}
                        >
                            ✨ AIスタジオで作り直す / 改良する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    formContainer: {
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'var(--surface-color)',
        padding: '3rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
    },
    title: {
        textAlign: 'center',
        fontSize: '2rem',
        marginBottom: '2rem',
        fontWeight: '700',
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
    input: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
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
        padding: '1rem',
        background: 'var(--primary-gradient)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
    }
};

export default EditApp;
