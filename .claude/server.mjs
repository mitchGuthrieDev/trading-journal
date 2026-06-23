import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, normalize } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.csv':'text/csv', '.md':'text/plain' };
createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' ) p = '/index.html';
  const fp = normalize(join(root, p));
  if (!fp.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  try {
    const data = await readFile(fp);
    const ext = fp.slice(fp.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(8765, () => console.log('listening on 8765'));
