// api/recruit.js
export default async function handler(req, res) {
  // Basic CORS (safe if your site is on another domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
  if (!DISCORD_WEBHOOK) return res.status(500).send("Missing webhook");

  const { name, email, role, region, video, youtube, twitter, portfolio, message } = req.body || {};
  if (!name || !email || !role || !video) return res.status(400).send("Missing required fields");

  const embed = {
    title: "New Recruitment Submission",
    color: 0xf3c300,
    fields: [
      { name: "Name", value: String(name), inline: true },
      { name: "Email", value: String(email), inline: true },
      { name: "Role", value: String(role), inline: true },
      ...(region ? [{ name: "Region", value: String(region), inline: true }] : []),
      { name: "Video Link", value: String(video), inline: false },
      ...(youtube ? [{ name: "YouTube", value: String(youtube), inline: true }] : []),
      ...(twitter ? [{ name: "Twitter", value: String(twitter), inline: true }] : []),
      ...(portfolio ? [{ name: "Portfolio", value: String(portfolio), inline: false }] : []),
      ...(message ? [{ name: "About", value: String(message), inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
  };

  const r = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Essence Recruit Bot", embeds: [embed] }),
  });

  if (!r.ok) return res.status(502).send("Discord error");
  res.status(200).json({ ok: true });
}
