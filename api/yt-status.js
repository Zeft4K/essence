export default async function handler(req, res) {
  // Allow your site
  const ORIGIN = 'https://teamessence.org';
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Vary', 'Origin'); // good cache hygiene
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // preflight OK
  }

  try {
    const { id, handle, q } = req.query;
    const key = process.env.YT_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing YT_API_KEY env' });

    const fetchJson = async (url) => (await fetch(url)).json();

    let channelId = id;

    if (!channelId) {
      const query = (handle ? `@${handle.replace(/^@/, '')}` : (q || '')).trim();
      if (!query) return res.status(400).json({ error: 'Provide id or handle or q' });

      const found = await fetchJson(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`
      );
      const item = found?.items?.[0];
      channelId = item?.id?.channelId;
      if (!channelId) return res.status(404).json({ error: 'Channel not found' });
    }

    const stats = await fetchJson(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${key}`
    );

    const ch = stats?.items?.[0];
    if (!ch) return res.status(404).json({ error: 'Channel statistics not found' });

    const s = ch.statistics || {};
    const sn = ch.snippet || {};

    return res.status(200).json({
      channelId,
      title: sn.title || '',
      handle: sn.customUrl || '',
      subscribers: s.hiddenSubscriberCount ? null : Number(s.subscriberCount || 0),
      views: Number(s.viewCount || 0),
      videoCount: Number(s.videoCount || 0),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
