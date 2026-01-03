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

    console.log('=== combineFiles Debug ===');
    console.log('Files:', files.map(f => f.name));
    console.log('Entry point:', entryPoint);

    // Find CSS and JS files
    const cssFiles = files.filter(f => f.name.endsWith('.css') && f.name !== entryPoint);
    const jsFiles = files.filter(f => f.name.endsWith('.js') && f.name !== entryPoint);

    console.log('CSS files:', cssFiles.map(f => f.name));
    console.log('JS files:', jsFiles.map(f => f.name));

    // Inject CSS
    if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(f => f.content).join('\n\n');
        const styleTag = `<style>\n${cssContent}\n</style>`;

        console.log('Injecting CSS...');
        console.log('CSS content length:', cssContent.length);

        // Try to insert before </head>, case-insensitive
        if (html.toLowerCase().includes('</head>')) {
            const headCloseIndex = html.toLowerCase().indexOf('</head>');
            html = html.slice(0, headCloseIndex) + styleTag + '\n' + html.slice(headCloseIndex);
            console.log('✅ Inserted CSS before </head>');
        } else if (html.toLowerCase().includes('<body')) {
            // Insert after <body> tag
            const bodyMatch = html.match(/<body[^>]*>/i);
            if (bodyMatch) {
                const bodyOpenIndex = html.indexOf(bodyMatch[0]) + bodyMatch[0].length;
                html = html.slice(0, bodyOpenIndex) + '\n' + styleTag + html.slice(bodyOpenIndex);
                console.log('✅ Inserted CSS after <body>');
            }
        } else {
            html = styleTag + html;
            console.log('⚠️ No head or body found, prepended CSS');
        }
    }

    // Inject JS
    if (jsFiles.length > 0) {
        const jsContent = jsFiles.map(f => f.content).join('\n\n');
        const scriptTag = `<script>\n${jsContent}\n</script>`;

        console.log('Injecting JS...');

        // Try to insert before </body>, case-insensitive
        if (html.toLowerCase().includes('</body>')) {
            const bodyCloseIndex = html.toLowerCase().indexOf('</body>');
            html = html.slice(0, bodyCloseIndex) + scriptTag + '\n' + html.slice(bodyCloseIndex);
            console.log('✅ Inserted JS before </body>');
        } else {
            html += scriptTag;
            console.log('⚠️ No </body> found, appended JS');
        }
    }

    console.log('=========================');

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
