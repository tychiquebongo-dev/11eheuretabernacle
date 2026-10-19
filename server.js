const http = require('http');
const fs = require('fs');
const path = require('path');

// Chargement automatique du fichier .env
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const DATA_FILE = path.join(__dirname, 'data', 'content.json');

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: GET /api/content
  if (req.url === '/api/content' && req.method === 'GET') {
    if (fs.existsSync(DATA_FILE)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(DATA_FILE).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
    }
    return;
  }

  // API Endpoint: POST /api/content
  if (req.url === '/api/content' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Content saved successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API Endpoint: POST /api/upload (Téléversement sécurisé via clé .env)
  if (req.url === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 30 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const { image, name } = JSON.parse(body);
        if (!image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Aucune image fournie' }));
          return;
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const apiKey = process.env.IMGBB_API_KEY;

        // Si la clé ImgBB est présente dans le .env
        if (apiKey && apiKey.trim() && apiKey !== 'votre_cle_api_imgbb_ici') {
          const params = new URLSearchParams();
          params.append('image', base64Data);
          if (name) params.append('name', name);

          const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
            method: 'POST',
            body: params
          });
          const json = await imgbbRes.json();

          if (json.success && json.data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              url: json.data.url || json.data.display_url
            }));
            return;
          } else {
            console.warn('Erreur ImgBB:', json);
            // Si ImgBB échoue, on bascule sur l'enregistrement local
          }
        }

        // Fallback local : sauvegarde directe sur le disque
        const galleryDir = path.join(__dirname, 'assets', 'images', 'gallery');
        if (!fs.existsSync(galleryDir)) {
          fs.mkdirSync(galleryDir, { recursive: true });
        }

        const ext = image.includes('png') ? '.png' : (image.includes('webp') ? '.webp' : '.jpg');
        const filename = 'upload-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6) + ext;
        const filePath = path.join(galleryDir, filename);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: 'assets/images/gallery/' + filename
        }));

      } catch (err) {
        console.error('Erreur upload:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin') reqPath = '/admin.html';
  const filePath = path.join(__dirname, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (process.env.IMGBB_API_KEY) {
    console.log(`[Config] Clé IMGBB_API_KEY détectée dans le .env`);
  } else {
    console.log(`[Config] Aucune clé IMGBB_API_KEY dans le .env (mode stockage local actif)`);
  }
});
