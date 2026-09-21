const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Normalize url and strip leading /public if user typed it
  let reqUrl = req.url.split('?')[0];
  if (reqUrl.startsWith('/public/')) {
    reqUrl = reqUrl.substring(7);
  }

  // Default to index.html if root
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  // If no extension, try appending .html
  if (!path.extname(reqUrl)) {
    if (fs.existsSync(path.join(PUBLIC_DIR, reqUrl + '.html'))) {
      reqUrl += '.html';
    }
  }

  const filePath = path.join(PUBLIC_DIR, reqUrl);

  // Security: prevent directory traversal outside public
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end(`
          <div style="font-family: sans-serif; text-align: center; padding: 3rem;">
            <h2>Page Not Found</h2>
            <p>Could not find: <code>${reqUrl}</code></p>
            <p><a href="/index.html">Go to Home Page</a> | <a href="/login.html">Go to Login</a></p>
          </div>
        `);
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Server Error: ' + err.code);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`\n Server running successfully!`);
  console.log(` Landing page:   http://localhost:${PORT}/index.html`);
  console.log(` Login page:     http://localhost:${PORT}/login.html\n`);
});
