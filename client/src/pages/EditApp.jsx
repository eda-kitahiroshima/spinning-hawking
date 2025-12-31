import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config';
import { apiFetch } from '../lib/api';

const EditApp = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core App Data
    const [appData, setAppData] = useState({
        name: '',
        description: '',
        tags: '',
        code: '',
        screenshotUrl: ''
    });

    // UI State
    const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'settings'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Studio State
    const [chatInput, setChatInput] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [logs, setLogs] = useState([]); // Console logs from iframe

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiFetch(`/api/apps/${id}`);
                setAppData({
                    ...data,
                    tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
                    code: data.code || '<h1>No Code</h1>'
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAiEdit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isAiProcessing) return;

        setIsAiProcessing(true);
        try {
            const response = await apiFetch('/api/ai/edit', {
                method: 'POST',
                body: {
                    currentCode: appData.code,
                    instruction: chatInput
                }
            });

            setAppData(prev => ({ ...prev, code: response.code }));
            setChatInput('');
            setLogs(prev => [...prev, { type: 'system', message: 'AI updated the code successfully.' }]);
        } catch (err) {
            setLogs(prev => [...prev, { type: 'error', message: `AI Error: ${err.message}` }]);
            alert(`AI修正に失敗しました: ${err.message}`);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const tagsArray = appData.tags.split(',').map(t => t.trim()).filter(Boolean);

            // ToDo: Handle screenshot upload if changed (not implemented in this quick editor yet)

            await apiFetch(`/api/apps/${id}`, {
                method: 'PUT',
                body: {
                    ...appData,
                    tags: JSON.stringify(tagsArray)
                }
            });
            alert('保存しました！');
        } catch (err) {
            alert(`保存失敗: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Loading Studio...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>;

    return (
        <div style={styles.container}>
            {/* Header Toolbar */}
            <div style={styles.toolbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')} style={styles.iconButton}>←</button>
                    <h1 style={styles.appTitle}>{appData.name || 'Untitled App'}</h1>
                    <span style={styles.badge}>Studio Mode</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={styles.tabs}>
                        <button
                            style={activeTab === 'studio' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('studio')}
                        >
                            🎨 Studio
                        </button>
                        <button
                            style={activeTab === 'settings' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('settings')}
                        >
                            ⚙️ Settings
                        </button>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={styles.main}>
                {activeTab === 'studio' ? (
                    <div style={styles.studioGrid}>
                        {/* Left: Preview */}
                        <div style={styles.previewColumn}>
                            <div style={styles.panelHeader}>
                                <span>📱 Live Preview</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>Code is running locally</span>
                            </div>
                            <div style={styles.iframeWrapper}>
                                <PreviewIframe code={appData.code} onLog={(l) => setLogs(p => [...p, l])} />
                            </div>
                            {/* Mini Log Console */}
                            <div style={styles.logConsole}>
                                {logs.slice(-3).map((l, i) => (
                                    <div key={i} style={{ color: l.type === 'error' ? '#ff6b6b' : '#888', fontSize: '0.75rem' }}>
                                        [{l.type}] {l.message}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: AI Chat & Code */}
                        <div style={styles.toolsColumn}>
                            <div style={styles.chatSection}>
                                <div style={styles.panelHeader}>🤖 AI Co-Pilot</div>
                                <div style={styles.chatHistory}>
                                    <div style={styles.systemMsg}>
                                        「{appData.name}」の修正をお手伝いします。
                                        「ボタンの色を赤に変えて」「リセット機能を追加して」のように指示してください。
                                    </div>
                                    {/* History could be expanded here */}
                                </div>
                                <form onSubmit={handleAiEdit} style={styles.chatInputArea}>
                                    <textarea
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="AIへの指示を入力... (例: 背景を黒にして)"
                                        style={styles.chatTextarea}
                                        disabled={isAiProcessing}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAiProcessing || !chatInput.trim()}
                                        style={{
                                            ...styles.sendButton,
                                            opacity: (isAiProcessing || !chatInput.trim()) ? 0.5 : 1
                                        }}
                                    >
                                        {isAiProcessing ? 'Thinking...' : 'Send'}
                                    </button>
                                </form>
                            </div>

                            <div style={styles.manualCodeSection}>
                                <div style={styles.panelHeader}>
                                    <span>📝 Source Code</span>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('手動変更はAIの認識とずれる可能性があります。続けますか？')) {
                                                // No-op, just warning
                                            }
                                        }}
                                        style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                                    >
                                        ⚠️ Manual Edit
                                    </button>
                                </div>
                                <textarea
                                    value={appData.code}
                                    onChange={e => setAppData({ ...appData, code: e.target.value })}
                                    style={styles.codeEditor}
                                    spellCheck="false"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Settings Tab */
                    <div style={styles.settingsContainer}>
                        <div style={styles.formGroup}>
                            <label>App Name</label>
                            <input
                                value={appData.name}
                                onChange={e => setAppData({ ...appData, name: e.target.value })}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={appData.description}
                                onChange={e => setAppData({ ...appData, description: e.target.value })}
                                style={styles.input}
                                rows={4}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Tags</label>
                            <input
                                value={appData.tags}
                                onChange={e => setAppData({ ...appData, tags: e.target.value })}
                                style={styles.input}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Reused Preview Component (Simplified)
const PreviewIframe = ({ code, onLog }) => {
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'console') {
                onLog({ type: event.data.level, message: event.data.args.join(' ') });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onLog]);

    const augmentedCode = `
        <script>
            (function() {
                const send = (level, args) => {
                    try { window.parent.postMessage({ type: 'console', level, args: args.map(String) }, '*'); } catch(e) {}
                };
                console.log = (...args) => send('log', args);
                console.error = (...args) => send('error', args);
                window.onerror = (msg) => send('error', [msg]);
            })();
        </script>
        ${code}
    `;

    return (
        <iframe
            title="Preview"
            srcDoc={augmentedCode}
            style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
        />
    );
};

const styles = {
    container: {
        height: 'calc(100vh - 64px)', // Adjust for global header if exists
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a1a',
        color: 'white',
    },
    toolbar: {
        height: '60px',
        padding: '0 2rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#252525',
    },
    appTitle: { fontSize: '1.2rem', fontWeight: 'bold', margin: '0' },
    badge: { fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px', marginLeft: '1rem', color: '#888' },
    iconButton: { background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', marginRight: '1rem' },
    tabs: { display: 'flex', gap: '0.5rem', background: '#111', padding: '4px', borderRadius: '8px' },
    tab: { padding: '6px 16px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', borderRadius: '6px' },
    activeTab: { padding: '6px 16px', background: '#444', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '6px' },
    saveButton: { background: 'var(--primary-gradient)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },

    main: { flex: 1, overflow: 'hidden' },
    studioGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 400px', // Preview takes remaining space, Tools fixed width
        height: '100%',
    },
    previewColumn: {
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        background: '#000',
    },
    toolsColumn: {
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
    },
    iframeWrapper: {
        flex: 1,
        background: 'white',
        position: 'relative',
    },
    logConsole: {
        height: '100px',
        background: '#111',
        borderTop: '1px solid #333',
        padding: '0.5rem',
        overflowY: 'auto',
        fontFamily: 'monospace',
    },
    chatSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid #333',
    },
    manualCodeSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px',
    },
    panelHeader: {
        padding: '0.5rem 1rem',
        background: '#252525',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: '#ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatHistory: {
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    systemMsg: {
        background: '#333',
        padding: '0.8rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#ddd',
    },
    chatInputArea: {
        padding: '1rem',
        background: '#252525',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    chatTextarea: {
        resize: 'none',
        height: '80px',
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid #444',
        background: '#1a1a1a',
        color: 'white',
        outline: 'none',
    },
    sendButton: {
        padding: '0.6rem',
        background: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    codeEditor: {
        flex: 1,
        background: '#151515',
        color: '#a9b7c6',
        border: 'none',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        resize: 'none',
        outline: 'none',
    },
    settingsContainer: {
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '2rem',
    },
    formGroup: { marginBottom: '1.5rem' },
    input: { width: '100%', padding: '0.8rem', background: '#333', border: '1px solid #444', color: 'white', borderRadius: '6px' },
};

export default EditApp;
