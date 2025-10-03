const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let requestPath = req.url;

    // Handle clean URLs - if path doesn't have an extension and isn't a file, serve index.html
    const hasExtension = path.extname(requestPath) !== '';

    // Determine the file to serve
    let filePath;

    if (requestPath === '/') {
        filePath = './index.html';
    } else if (!hasExtension) {
        // Clean URL - serve index.html and let React handle routing
        filePath = './index.html';
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
