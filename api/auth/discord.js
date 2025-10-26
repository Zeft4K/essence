module.exports = (req, res) => {
  const { DISCORD_CLIENT_ID, DISCORD_SCOPE = 'identify guilds' } = process.env;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] || 'https');
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DISCORD_CLIENT_ID,
    scope: DISCORD_SCOPE,
    redirect_uri: redirectUri,
    prompt: 'consent',
  });

  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${params}` });
  res.end();
};
