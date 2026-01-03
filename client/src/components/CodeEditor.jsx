import React from 'react';

function CodeEditor({ value, onChange, filename }) {
    const handleChange = (e) => {
        const newValue = e.target.value;
        console.log('🎯 CodeEditor onChange called, new value length:', newValue.length);
        onChange(newValue);
    };

    return (
        <textarea
            value={value}
            onChange={handleChange}
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
