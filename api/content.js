// Vercel Serverless Function: /api/content
// Permet la lecture et la mise à jour automatique de data/content.json sur GitHub

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'tychiquebongo-dev/11eheuretabernacle';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = 'data/content.json';

  // GET /api/content
  if (req.method === 'GET') {
    const localFile = path.join(process.cwd(), 'data', 'content.json');
    if (fs.existsSync(localFile)) {
      try {
        const content = fs.readFileSync(localFile, 'utf-8');
        return res.status(200).json(JSON.parse(content));
      } catch (e) {
        // Fallback vers lecture GitHub
      }
    }

    // Si le fichier local n'est pas lisible, lire directement sur GitHub
    try {
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': '11e-Heure-Tabernacle-App',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
        return res.status(200).json(JSON.parse(decoded));
      }
    } catch (err) {
      console.error('Erreur lecture GitHub /api/content:', err);
    }

    return res.status(404).json({ error: 'Fichier content.json introuvable' });
  }

  // POST /api/content (Mise à jour automatique sur GitHub)
  if (req.method === 'POST') {
    const newContent = req.body;
    if (!newContent) {
      return res.status(400).json({ success: false, error: 'Données vides' });
    }

    const contentStr = typeof newContent === 'string' ? newContent : JSON.stringify(newContent, null, 2);

    if (!token) {
      return res.status(200).json({
        success: true,
        synced: false,
        message: 'Modifications enregistrées localement. Ajoutez GITHUB_TOKEN dans vos variables Vercel pour la mise en ligne automatique pour tous les fidèles.'
      });
    }

    try {
      // 1. Obtenir le sha actuel du fichier sur GitHub
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': '11e-Heure-Tabernacle-App'
        }
      });

      if (!getRes.ok) {
        const errText = await getRes.text();
        return res.status(400).json({
          success: false,
          synced: false,
          error: `Erreur récupération sha GitHub: ${errText}`
        });
      }

      const getData = await getRes.json();
      const currentSha = getData.sha;

      // 2. Commit sur GitHub
      const base64Payload = Buffer.from(contentStr, 'utf-8').toString('base64');
      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
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
          sha: currentSha,
          branch: branch
        })
      });

      const putJson = await putRes.json();

      if (putRes.ok) {
        return res.status(200).json({
          success: true,
          synced: true,
          commitUrl: putJson.commit?.html_url,
          message: '✅ Synchronisé sur GitHub ! Vercel redéploie automatiquement le site pour tous les visiteurs.'
        });
      } else {
        return res.status(400).json({
          success: false,
          synced: false,
          error: putJson.message || 'Erreur lors du commit GitHub'
        });
      }
    } catch (syncErr) {
      console.error('Erreur synchronisation GitHub:', syncErr);
      return res.status(500).json({ success: false, synced: false, error: syncErr.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
};
