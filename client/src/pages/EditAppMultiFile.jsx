import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileManager from '../components/FileManager';
import CodeEditor from '../components/CodeEditor';
import { apiFetch } from '../lib/api';

// Simple debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function EditAppMultiFile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [files, setFiles] = useState([{ name: 'index.html', content: '' }]);
    const [activeFile, setActiveFile] = useState('index.html');
    const [entryPoint, setEntryPoint] = useState('index.html');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [previewKey, setPreviewKey] = useState(0);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

    // Load app files on mount
    useEffect(() => {
        if (id) {
            loadAppFiles();
        }
    }, [id]);

    const loadAppFiles = async () => {
        try {
            const data = await apiFetch(`/api/apps/${id}/files`);
            setFiles(data.files);
            setEntryPoint(data.entryPoint);
            setActiveFile(data.files[0]?.name || 'index.html');
        } catch (err) {
            console.error('Failed to load files:', err);
            alert('ファイルの読み込みに失敗しました');
        }
    };

    const handleFileSelect = (filename) => {
        setActiveFile(filename);
    };

    const handleFileAdd = (filename) => {
        const defaultContent = filename.endsWith('.html')
            ? '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>'
            : filename.endsWith('.css')
                ? '/* CSS styles */\n'
                : filename.endsWith('.jsx')
                    ? '// React component\n'
                    : '// JavaScript code\n';

        setFiles([...files, { name: filename, content: defaultContent }]);
        setActiveFile(filename);
    };

    const handleFileDelete = (filename) => {
        if (files.length === 1) {
            alert('最後のファイルは削除できません');
            return;
        }

        const newFiles = files.filter(f => f.name !== filename);
        setFiles(newFiles);

        // If deleting active file, switch to first file
        if (activeFile === filename) {
            setActiveFile(newFiles[0].name);
        }

        // If deleting entry point, set new entry point
        if (entryPoint === filename) {
            const newEntryPoint = newFiles.find(f => f.name.endsWith('.html'))?.name || newFiles[0].name;
            setEntryPoint(newEntryPoint);
        }
    };

    // Actual save function
    const saveFiles = async (filesToSave, ep) => {
        setIsSaving(true);
        setSaveMessage('💾 保存中...');

        try {
            await apiFetch(`/api/apps/${id}/files`, {
                method: 'PUT',
                body: { files: filesToSave, entryPoint: ep }
            });

            setSaveMessage('✅ 保存しました');
            setPreviewKey(prev => prev + 1); // Refresh preview
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveMessage('❌ 保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    // Debounced auto-save (1 second delay)
    const debouncedSave = useMemo(
        () => debounce((filesToSave, ep) => {
            if (autoSaveEnabled) {
                saveFiles(filesToSave, ep);
            }
        }, 1000),
        [id, autoSaveEnabled]
    );

    const handleCodeChange = (newContent) => {
        const newFiles = files.map(f =>
            f.name === activeFile ? { ...f, content: newContent } : f
        );
        setFiles(newFiles);
        debouncedSave(newFiles, entryPoint);
    };

    const handleSave = () => {
        saveFiles(files, entryPoint);
    };

    const currentFile = files.find(f => f.name === activeFile);

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid #333',
                backgroundColor: '#000',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>マルチファイルエディタ</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={autoSaveEnabled}
                            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        />
                        自動保存
                    </label>
                    {saveMessage && (
                        <span style={{ fontSize: '0.9rem', color: saveMessage.includes('✅') ? '#10b981' : '#ef4444' }}>
                            {saveMessage}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.6 : 1
                        }}
                    >
                        {isSaving ? '保存中...' : '💾 保存'}
                    </button>
                    <button
                        onClick={() => window.open(`/preview/${id}`, '_blank')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        👁️ プレビュー
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ← 戻る
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* File Manager Sidebar */}
                <FileManager
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={handleFileSelect}
                    onFileAdd={handleFileAdd}
                    onFileDelete={handleFileDelete}
                />

                {/* Code Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* File Tab */}
                    <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#000',
                        borderBottom: '1px solid #333',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {currentFile?.name}
                        </span>
                        <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={entryPoint === activeFile}
                                onChange={(e) => {
                                    if (e.target.checked && activeFile.endsWith('.html')) {
                                        setEntryPoint(activeFile);
                                    }
                                }}
                                disabled={!activeFile.endsWith('.html')}
                            />
                            エントリーポイント
                        </label>
                    </div>

                    {/* Code Editor with Syntax Highlighting */}
                    <CodeEditor
                        value={currentFile?.content || ''}
                        onChange={handleCodeChange}
                        filename={activeFile}
                    />
                </div>
            </div>
        </div>
    );
}

export default EditAppMultiFile;
