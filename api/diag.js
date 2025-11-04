// /api/diag-env.js  (Vercel serverless function)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://teamessence.org');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const present = !!process.env.YT_API_KEY;
  // DO NOT log the key — just whether it exists
  console.log('[diag] VERCEL_ENV=', process.env.VERCEL_ENV, ' key=', present ? 'exists' : 'missing');

  return res.status(200).json({
    vercelEnv: process.env.VERCEL_ENV || 'unknown', // 'production' | 'preview' | 'development'
    deploymentUrl: req.headers['x-vercel-deployment-url'] || null,
    keyPresent: present
  });
}
