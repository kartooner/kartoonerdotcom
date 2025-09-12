const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

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
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
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