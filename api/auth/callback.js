import { sendCookie, json } from '../_lib.js';

async function tokenFromCode(code){
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI
  });
  const r = await fetch('https://discord.com/api/oauth2/token', {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });
  if(!r.ok) throw new Error('oauth token error');
  return r.json();
}

async function getUser(access_token){
  const r = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if(!r.ok) throw new Error('user fetch error');
  return r.json();
}

async function getGuildMember(userId){
  // Requires your bot in the guild + "Server Members Intent"
  const r = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`, {
    headers: { Authorization: process.env.DISCORD_BOT_TOKEN }
  });
  if(!r.ok) return null;
  return r.json();
}

export default async function handler(req, res){
  try{
    const { searchParams } = new URL(req.url, 'http://localhost');
    const code = searchParams.get('code');
    if(!code) return json(res, 400, { error:'missing code' });

    const token = await tokenFromCode(code);
    const me = await getUser(token.access_token);
    const member = await getGuildMember(me.id);

    const roles = Array.isArray(member?.roles) ? member.roles : [];
    // You can map role IDs to friendly names here:
    // Example mapping:
    const map = {
      'ROLE_ID_BRONZE':'Bronze Gear',
      'ROLE_ID_SILVER':'Silver Gear',
      'ROLE_ID_GOLDEN':'Golden Gear',
      'ROLE_ID_ONYX':'Onyx Guard',
      'ROLE_ID_DIAMOND':'Diamond Gear'
    };
    const friendly = roles.map(r => map[r]).filter(Boolean);

    const avatar_url = me.avatar
      ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=64`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    sendCookie(res, {
      sub: me.id,
      username: me.username,
      discriminator: me.discriminator,
      avatar_url,
      roles: friendly
    });

    // Redirect back to page user came from (or home)
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (e){
    json(res, 500, { error: String(e) });
  }
}
