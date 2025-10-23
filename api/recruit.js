// Vercel Serverless Function (No Framework)
// Path: /api/recruit
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24h
const MAX_REQUESTS_PER_IP = 1;

// In-memory map (resets on cold start; use Redis/KV for persistence)
const ipRequests = global.ipRequests || new Map();
if (!global.ipRequests) global.ipRequests = ipRequests;

function getIP(req) {
  const xf = req.headers['x-forwarded-for'];
  if (Array.isArray(xf)) return xf[0];
  if (typeof xf === 'string') return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limit
  const ip = getIP(req);
  const now = Date.now();
  const entry = ipRequests.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  ipRequests.set(ip, entry);

  if (entry.count > MAX_REQUESTS_PER_IP) {
    return res
      .status(429)
      .json({ error: 'You can only submit once per day. Try again tomorrow.' });
  }

  // Parse body
  let data;
  try {
    data = req.body && typeof req.body === 'object' ? req.body : JSON.parse(await readReqBody(req));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const {
    name = '', email = '', role = '', region = '',
    video = '', youtube = '', twitter = '', portfolio = '', message = ''
  } = data || {};

  if (!name || !email || !role || !video) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Discord webhook (supports either env var name)
  const DISCORD_WEBHOOK =
    process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK;

  if (!DISCORD_WEBHOOK) {
    return res.status(500).json({ error: 'Missing Discord webhook env var' });
  }

  const embed = {
    title: 'New Recruitment Submission',
    color: 0xF3C300,
    fields: [
      { name: 'Name', value: String(name), inline: true },
      { name: 'Email', value: String(email), inline: true },
      { name: 'Role', value: String(role), inline: true },
      ...(region ? [{ name: 'Region', value: String(region), inline: true }] : []),
      { name: 'Video Link', value: String(video), inline: false },
      ...(youtube ? [{ name: 'YouTube', value: String(youtube), inline: true }] : []),
      ...(twitter ? [{ name: 'Twitter', value: String(twitter), inline: true }] : []),
      ...(portfolio ? [{ name: 'Portfolio', value: String(portfolio), inline: false }] : []),
      ...(message ? [{ name: 'About', value: String(message), inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    const r = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Essence Recruit Bot', embeds: [embed] }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Discord error', detail: text.slice(0, 200) });
    }
  } catch (e) {
    return res.status(502).json({ error: 'Discord fetch failed' });
  }

  return res.status(200).json({ ok: true });
}

function readReqBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data || '{}'));
    req.on('error', reject);
  });
}
