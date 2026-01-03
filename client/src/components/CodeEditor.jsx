import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

function CodeEditor({ value, onChange, filename }) {
    const editorRef = useRef(null);
    const viewRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Determine language extension based on filename
        let languageExtension;
        if (filename.endsWith('.html')) {
            languageExtension = html();
        } else if (filename.endsWith('.css')) {
            languageExtension = css();
        } else if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
            languageExtension = javascript({ jsx: true });
        } else {
            languageExtension = javascript();
        }

        // Create editor view
        const view = new EditorView({
            doc: value || '',
            extensions: [
                basicSetup,
                languageExtension,
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                })
            ],
            parent: editorRef.current
        });

        viewRef.current = view;

        // Cleanup
        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [filename]); // Recreate when filename changes

    // Update content when value changes externally
    useEffect(() => {
        if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
            const view = viewRef.current;
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: value || ''
                }
            });
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            style={{
                flex: 1,
                overflow: 'auto'
            }}
        />
    );
}

export default CodeEditor;
