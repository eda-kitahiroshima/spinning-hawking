import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileManager from '../components/FileManager';
import { apiFetch } from '../lib/api';

function EditAppMultiFile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [files, setFiles] = useState([{ name: 'index.html', content: '' }]);
    const [activeFile, setActiveFile] = useState('index.html');
    const [entryPoint, setEntryPoint] = useState('index.html');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

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

    const handleCodeChange = (newContent) => {
        setFiles(files.map(f =>
            f.name === activeFile ? { ...f, content: newContent } : f
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            await apiFetch(`/api/apps/${id}/files`, {
                method: 'PUT',
                body: { files, entryPoint }
            });

            setSaveMessage('✅ 保存しました');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveMessage('❌ 保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
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
                borderBottom: '1px solid #ddd',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>マルチファイルエディタ</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                        backgroundColor: '#f3f4f6',
                        borderBottom: '1px solid #ddd',
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

                    {/* Textarea */}
                    <textarea
                        value={currentFile?.content || ''}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            border: 'none',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none'
                        }}
                        placeholder="コードを入力..."
                    />
                </div>
            </div>
        </div>
    );
}

export default EditAppMultiFile;
