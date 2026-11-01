/**
 * ISTIQOMAH GROSIR BULUSARI - DUAL PORT SYNC SERVER (Node.js)
 * Port 3000: Mobile Offline-First Preview
 * Port 3001: Windows Desktop Enterprise Preview
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DB_DIR = path.join(ROOT, 'database');
const DB_FILE = path.join(DB_DIR, 'istiqomah_bulusari_db.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
let cachedState = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf8') : '{}';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function createHandler(defaultEntry) {
  return (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    let pathname = urlObj.pathname;

    if (pathname === '/api/state' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(cachedState || '{}');
    }

    if (pathname === '/api/sync' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.state) {
            cachedState = JSON.stringify(parsed.state, null, 2);
            fs.writeFileSync(DB_FILE, cachedState, 'utf8');
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, state: JSON.parse(cachedState || '{}') }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false }));
        }
      });
      return;
    }

    if (pathname === '/' || pathname === '/index.html') {
      pathname = defaultEntry;
    }

    const filePath = path.join(ROOT, pathname);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  };
}

http.createServer(createHandler('/mobile.html')).listen(3000, () => {
  console.log('Mobile Offline-First Preview running at http://localhost:3000');
});

http.createServer(createHandler('/desktop.html')).listen(3001, () => {
  console.log('Windows Desktop Preview running at http://localhost:3001');
});

