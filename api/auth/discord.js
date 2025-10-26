export default async function handler(req, res){
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    scope: 'identify guilds.members.read',
    prompt: 'consent'
  });
  res.writeHead(302, { Location: `https://discord.com/api/oauth2/authorize?${params}` });
  res.end();
}
