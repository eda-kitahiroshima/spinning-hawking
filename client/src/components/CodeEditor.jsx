import React from 'react';

function CodeEditor({ value, onChange, filename }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                backgroundColor: '#fff',
                color: '#000',
                lineHeight: '1.5'
            }}
            spellCheck={false}
            placeholder="コードを入力..."
        />
    );
}

export default CodeEditor;
