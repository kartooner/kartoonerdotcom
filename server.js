const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const port = 3000;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.xml': 'application/xml'
};

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  
  // Serve index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Handle clean URLs - if no extension, try .html
  if (!path.extname(pathname)) {
    if (fs.existsSync(path.join(__dirname, pathname, 'index.html'))) {
      pathname = path.join(pathname, 'index.html');
    } else if (fs.existsSync(path.join(__dirname, pathname + '.html'))) {
      pathname = pathname + '.html';
    }
  }
  
  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      // Set caching headers for static assets
      const headers = { 'Content-Type': contentType };

      if (ext === '.css' || ext === '.js' || ext === '.woff2' || ext === '.woff' || ext === '.ttf') {
        headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year
      } else if (ext === '.html') {
        headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour
      } else if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.webp' || ext === '.svg') {
        headers['Cache-Control'] = 'public, max-age=86400'; // 1 day
      }

      // Check if client accepts gzip
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const shouldCompress = (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json' || ext === '.xml') &&
                            acceptEncoding.includes('gzip') && content.length > 1024;

      if (shouldCompress) {
        headers['Content-Encoding'] = 'gzip';
        zlib.gzip(content, (err, compressedContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Compression Error');
          } else {
            res.writeHead(200, headers);
            res.end(compressedContent);
          }
        });
      } else {
        res.writeHead(200, headers);
        res.end(content);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Auto-shutdown after 10 minutes
setTimeout(() => {
  console.log('Server shutting down after 10 minutes...');
  server.close();
  process.exit(0);
}, 10 * 60 * 1000);