const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let requestPath = req.url;

    // Strip /aiadvisor prefix if present
    if (requestPath.startsWith('/aiadvisor')) {
        requestPath = requestPath.substring('/aiadvisor'.length) || '/';
    }

    // Handle clean URLs - if path doesn't have an extension and isn't a file, serve index.html
    const hasExtension = path.extname(requestPath) !== '';

    // Determine the file to serve
    let filePath;

    if (requestPath === '/') {
        filePath = './index.html';
    } else if (!hasExtension) {
        // Clean URL routing
        // For paths like /hcm/shift-swap, serve app.html so React can handle routing
        // The app.html will check authentication and redirect to login if needed
        if (requestPath.match(/^\/[^\/]+\/[^\/]+/)) {
            // Looks like an industry/template pattern - serve app.html
            filePath = './app.html';
        } else {
            // Other clean URLs - serve index.html (login page)
            filePath = './index.html';
        }
    } else {
        // Regular file request
        filePath = '.' + requestPath;
    }

    // Determine content type
    const extname = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    const contentType = contentTypes[extname] || 'text/plain';

    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Clean URLs enabled - supports paths like /hcm/Auto-approve%20PTO%20requests');
});
