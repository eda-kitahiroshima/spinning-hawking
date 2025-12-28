import React from 'react';

const CodeEditor = ({ value, onChange, name, readOnly = false, style }) => {
    return (
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                fontSize: '14px',
                border: '1px solid #333',
                borderRadius: '8px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.5',
                tabSize: 4,
                ...style
            }}
            spellCheck="false"
            placeholder="// ここにコードを書いてください..."
        />
    );
};

export default CodeEditor;
