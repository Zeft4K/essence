const crypto = require('crypto');

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function sign(payload, secret, expSec = 60*60*24*7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now()/1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const s = b64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest());
  return `${h}.${p}.${s}`;
}
function cookie(name, val, { maxAge } = {}) {
  const parts = [`${name}=${val}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure'];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

module.exports = async (req, res) => {
  try {
    const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, COOKIE_NAME = 'te_sess' } = process.env;

    const code = req.query.code;
    if (!code) { res.statusCode = 400; return res.end('Missing ?code'); }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] || 'https');
    const redirectUri = `${proto}://${host}/api/auth/callback`;

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      })
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token) {
      console.error('Token error:', token);
      res.statusCode = 500; return res.end('Token exchange failed');
    }

    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    const user = await meRes.json();
    if (!meRes.ok || !user?.id) {
      console.error('User error:', user);
      res.statusCode = 500; return res.end('User fetch failed');
    }

    const jwt = sign({
      sub: user.id,
      name: user.global_name || user.username,
      avatar: user.avatar || null,
      prov: 'discord',
    }, JWT_SECRET);

    res.setHeader('Set-Cookie', cookie(COOKIE_NAME, jwt, { maxAge: 60*60*24*7 }));
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('Auth failed');
  }
};
