const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chargement automatique et dynamique du fichier .env
const ENV_FILE = path.join(__dirname, '.env');
function loadEnv() {
  if (fs.existsSync(ENV_FILE)) {
    try {
      const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
      envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const idx = line.indexOf('=');
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (key) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {}
  }
}
loadEnv();

function getExpectedToken() {
  loadEnv();
  const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
  const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';
  if (!configuredPass && !configuredPin) {
    return null; // Aucun token possible si les variables ne sont pas configurées
  }
  const secretKey = `${configuredPass}|${configuredPin}`;
  return crypto.createHash('sha256').update(secretKey + '_tabernacle_salt_2026').digest('hex');
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
  // Rafraîchir les variables .env à chaque requête si modifié
  loadEnv();

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: POST /api/auth (Authentification Pastorale)
  if (req.url === '/api/auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body || '{}');
        const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
        const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';

        // Verrouillage absolu sans variable de sécurité (réponse 401 identique pour ne donner aucun indice)
        if (!configuredPass && !configuredPin) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: "Code d'accès ou mot de passe incorrect."
          }));
          return;
        }

        let isAuthorized = false;
        if (configuredPass && password === configuredPass) isAuthorized = true;
        if (configuredPin && password === configuredPin) isAuthorized = true;

        if (isAuthorized) {
          const token = getExpectedToken();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token, message: 'Authentification réussie' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: "Code d'accès ou mot de passe incorrect." }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Format JSON invalide' }));
      }
    });
    return;
  }

  // API Endpoint: GET /api/content (Public)
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

  // API Endpoint: POST /api/content (Sécurisé par Token)
  if (req.url === '/api/content' && req.method === 'POST') {
    // Vérification d'authentification
    const authHeader = req.headers['authorization'] || '';
    const expectedToken = getExpectedToken();
    if (!expectedToken || !authHeader.includes(expectedToken)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Session non autorisée. Veuillez vous connecter.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const jsonFormatted = JSON.stringify(parsed, null, 2);
        fs.writeFileSync(DATA_FILE, jsonFormatted, 'utf-8');

        // Synchronisation GitHub si GITHUB_TOKEN est configuré
        let synced = false;
        let commitMsg = 'Modifications enregistrées localement';
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'tychiquebongo-dev/11eheuretabernacle';
        const branch = process.env.GITHUB_BRANCH || 'main';

        if (token && token.trim() && token !== 'votre_personal_access_token_github') {
          try {
            const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/data/content.json?ref=${branch}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'User-Agent': '11e-Heure-Tabernacle-App'
              }
            });
            if (getRes.ok) {
              const getData = await getRes.json();
              const base64Payload = Buffer.from(jsonFormatted, 'utf-8').toString('base64');
              const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/data/content.json`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github+json',
                  'User-Agent': '11e-Heure-Tabernacle-App',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'chore(content): mise a jour du site depuis le Back Office pastoral',
                  content: base64Payload,
                  sha: getData.sha,
                  branch: branch
                })
              });
              if (putRes.ok) {
                synced = true;
                commitMsg = 'Synchronisé sur GitHub ! Vercel redéploie le site public.';
              }
            }
          } catch (gitErr) {
            console.warn('Erreur synchro GitHub depuis le serveur local:', gitErr.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, synced, message: commitMsg }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API Endpoint: POST /api/upload (Sécurisé par Token)
  if (req.url === '/api/upload' && req.method === 'POST') {
    // Vérification d'authentification
    const authHeader = req.headers['authorization'] || '';
    const expectedToken = getExpectedToken();
    if (!expectedToken || !authHeader.includes(expectedToken)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Session requise pour téléverser.' }));
      return;
    }

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
  const filePath = path.normalize(path.join(__dirname, reqPath));

  // Protection de sécurité : Bloquer l'accès aux fichiers cachés (.env, .git, etc.) et directory traversal
  if (!filePath.startsWith(__dirname) || path.basename(filePath).startsWith('.') || reqPath.includes('/.')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Accès interdit : Fichier protégé.');
    return;
  }

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
  if (process.env.GITHUB_TOKEN) {
    console.log(`[Config] Token GITHUB_TOKEN détecté dans le .env (Option A active)`);
  }
});
