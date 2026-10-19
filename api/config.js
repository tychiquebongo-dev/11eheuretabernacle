// Vercel Serverless Function: GET /api/config
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.status(200).json({
    imgbbKey: process.env.IMGBB_API_KEY || '',
    hasGithubToken: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim())
  });
};
