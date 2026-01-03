import { useState } from 'react';

function FileManager({ files, activeFile, onFileSelect, onFileAdd, onFileDelete, onFileRename }) {
    const [newFileName, setNewFileName] = useState('');
    const [showAddInput, setShowAddInput] = useState(false);

    const handleAddFile = () => {
        if (newFileName.trim()) {
            // Validate filename
            if (!/^[a-zA-Z0-9_-]+\.(html|css|js|jsx)$/.test(newFileName)) {
                alert('ファイル名は英数字_-のみで、拡張子は.html, .css, .js, .jsxのいずれかにしてください');
                return;
            }

            // Check if file already exists
            if (files.find(f => f.name === newFileName)) {
                alert('同じ名前のファイルが既に存在します');
                return;
            }

            onFileAdd(newFileName);
            setNewFileName('');
            setShowAddInput(false);
        }
    };

    const getFileIcon = (filename) => {
        if (filename.endsWith('.html')) return '📄';
        if (filename.endsWith('.css')) return '🎨';
        if (filename.endsWith('.js')) return '⚙️';
        if (filename.endsWith('.jsx')) return '⚛️';
        return '📄';
    };

    return (
        <div className="file-manager" style={{
            width: '200px',
            borderRight: '1px solid #ddd',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            height: '100%',
            overflowY: 'auto'
        }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>📁 ファイル</h3>

            <div className="file-tree" style={{ marginBottom: '1rem' }}>
                {files.map(file => (
                    <div
                        key={file.name}
                        className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                        onClick={() => onFileSelect(file.name)}
                        style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '0.25rem',
                            backgroundColor: activeFile === file.name ? '#4f46e5' : 'transparent',
                            color: activeFile === file.name ? 'white' : '#333',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (activeFile !== file.name) {
                                e.currentTarget.style.backgroundColor = '#e5e7eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeFile !== file.name) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <span>
                            {getFileIcon(file.name)} {file.name}
                        </span>
                        {files.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`${file.name}を削除しますか？`)) {
                                        onFileDelete(file.name);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: activeFile === file.name ? 'white' : '#999',
                                    cursor: 'pointer',
                                    padding: '0',
                                    fontSize: '0.8rem'
                                }}
                                title="削除"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showAddInput ? (
                <div style={{ marginTop: '0.5rem' }}>
                    <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFile()}
                        placeholder="newfile.js"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            marginBottom: '0.5rem'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleAddFile}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            追加
                        </button>
                        <button
                            onClick={() => {
                                setShowAddInput(false);
                                setNewFileName('');
                            }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                backgroundColor: '#ccc',
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddInput(true)}
                    disabled={files.length >= 10}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: files.length >= 10 ? '#ccc' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: files.length >= 10 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                    title={files.length >= 10 ? '最大10ファイルまで' : ''}
                >
                    <span>+</span> 新しいファイル
                </button>
            )}

            {files.length >= 10 && (
                <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem', textAlign: 'center' }}>
                    最大10ファイル
                </p>
            )}
        </div>
    );
}

export default FileManager;
