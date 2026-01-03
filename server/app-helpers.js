/**
 * Helper functions for multi-file app support
 */

/**
 * Parse app code - returns files array if multi-file, or single file object if legacy
 */
function parseAppCode(codeString) {
    try {
        const parsed = JSON.parse(codeString);
        if (parsed.files && Array.isArray(parsed.files)) {
            // Multi-file format
            return {
                isMultiFile: true,
                files: parsed.files,
                entryPoint: parsed.entryPoint || 'index.html'
            };
        }
    } catch (e) {
        // Not JSON or parsing failed - treat as single file
    }

    // Single file (legacy format)
    return {
        isMultiFile: false,
        files: [{ name: 'index.html', content: codeString }],
        entryPoint: 'index.html'
    };
}

/**
 * Combine multiple files into a single HTML for preview
 */
function combineFiles(files, entryPoint = 'index.html') {
    const htmlFile = files.find(f => f.name === entryPoint);
    if (!htmlFile) {
        throw new Error(`Entry point "${entryPoint}" not found`);
    }

    let html = htmlFile.content;

    // Find CSS and JS files
    const cssFiles = files.filter(f => f.name.endsWith('.css') && f.name !== entryPoint);
    const jsFiles = files.filter(f => f.name.endsWith('.js') && f.name !== entryPoint);

    // Inject CSS
    if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(f => f.content).join('\n\n');
        const styleTag = `<style>\n${cssContent}\n</style>`;

        // Try to insert before </head>, fallback to start of <body>
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${styleTag}\n</head>`);
        } else if (html.includes('<body')) {
            html = html.replace(/<body([^>]*)>/, `<body$1>\n${styleTag}`);
        } else {
            html = styleTag + html;
        }
    }

    // Inject JS
    if (jsFiles.length > 0) {
        const jsContent = jsFiles.map(f => f.content).join('\n\n');
        const scriptTag = `<script>\n${jsContent}\n</script>`;

        // Try to insert before </body>, fallback to end
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}\n</body>`);
        } else {
            html += scriptTag;
        }
    }

    return html;
}

/**
 * Encode files array to JSON string for storage
 */
function encodeAppFiles(files, entryPoint = 'index.html') {
    return JSON.stringify({
        files,
        entryPoint
    });
}

module.exports = {
    parseAppCode,
    combineFiles,
    encodeAppFiles
};
