// Static dev server for dist/. Set PORT to choose a port (PORT=0 picks a free one).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  let file = resolve(root, '.' + pathname);
  const inside = relative(root, file);
  if (inside.startsWith('..') || isAbsolute(inside)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (pathname.endsWith('/')) file = resolve(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const missing = error.code === 'ENOENT' || error.code === 'EISDIR';
    res
      .writeHead(missing ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end(missing ? 'Not found' : 'Server error');
  }
});

const port = process.env.PORT === undefined ? 4173 : Number(process.env.PORT);
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use; try PORT=${port + 1} npm run dev` : error);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}/`));
