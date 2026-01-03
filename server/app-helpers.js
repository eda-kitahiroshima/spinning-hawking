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

    // Find CSS, JS, and JSX files
    const cssFiles = files.filter(f => f.name.endsWith('.css') && f.name !== entryPoint);
    const jsFiles = files.filter(f => f.name.endsWith('.js') && f.name !== entryPoint);
    const jsxFiles = files.filter(f => f.name.endsWith('.jsx') && f.name !== entryPoint);

    console.log('CSS files:', cssFiles.map(f => f.name));
    console.log('JS files:', jsFiles.map(f => f.name));
    console.log('JSX files:', jsxFiles.map(f => f.name));

    // If there are JSX files, inject React CDN and Babel
    if (jsxFiles.length > 0) {
        console.log('⚛️ React/JSX detected, injecting React CDN and Babel...');

        const reactCDN = `
    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel Standalone for JSX transpilation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;

        // Insert React CDN before </head>
        if (html.toLowerCase().includes('</head>')) {
            const headCloseIndex = html.toLowerCase().indexOf('</head>');
            html = html.slice(0, headCloseIndex) + reactCDN + '\n' + html.slice(headCloseIndex);
            console.log('✅ Inserted React CDN before </head>');
        } else {
            // Fallback: prepend to HTML
            html = reactCDN + '\n' + html;
            console.log('⚠️ No </head> found, prepended React CDN');
        }
    }

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

    // Inject JSX (with type="text/babel" for Babel transpilation)
    if (jsxFiles.length > 0) {
        console.log('⚛️ Injecting JSX files...');

        for (const jsxFile of jsxFiles) {
            const scriptTag = `<script type="text/babel">\n${jsxFile.content}\n</script>`;

            // Insert before </body>
            if (html.toLowerCase().includes('</body>')) {
                const bodyCloseIndex = html.toLowerCase().indexOf('</body>');
                html = html.slice(0, bodyCloseIndex) + scriptTag + '\n' + html.slice(bodyCloseIndex);
                console.log(`✅ Inserted ${jsxFile.name} before </body>`);
            } else {
                html += scriptTag;
                console.log(`⚠️ No </body> found, appended ${jsxFile.name}`);
            }
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
