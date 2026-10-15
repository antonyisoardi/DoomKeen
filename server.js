// Tiny zero-dependency static file server for local play: `npm start`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function resolveRequestPath(rawUrl) {
  const url = new URL(rawUrl, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  // Only the game itself is served: index.html and the src/ tree, never dotfiles.
  if (pathname !== '/index.html' && !pathname.startsWith('/src/')) return null;
  if (pathname.split('/').some((seg) => seg.startsWith('.'))) return null;
  const filePath = resolve(join(ROOT, normalize(pathname)));
  return filePath.startsWith(ROOT + sep) ? filePath : null;
}

const server = createServer(async (req, res) => {
  let filePath;
  try {
    filePath = resolveRequestPath(req.url);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (!filePath) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    const notFound = err.code === 'ENOENT' || err.code === 'EISDIR';
    if (!notFound) console.error(`Failed to serve ${filePath}:`, err);
    res.writeHead(notFound ? 404 : 500).end(notFound ? 'Not found' : 'Server error');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Commander Doom running at http://localhost:${PORT}`);
});
