// /api/yt-stats.js
export default async function handler(req, res) {
  try {
    const { id, handle, q } = req.query;
    const key = process.env.YT_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing YT_API_KEY env' });

    const fetchJson = async (url) => (await fetch(url)).json();

    let channelId = id;

    // If no channelId provided, try to resolve by handle or generic query
    if (!channelId) {
      const query = (handle ? `@${handle.replace(/^@/, '')}` : (q || '')).trim();
      if (!query) return res.status(400).json({ error: 'Provide id or handle or q' });

      // Resolve channel via search (type=channel)
      const found = await fetchJson(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`
      );
      const item = found?.items?.[0];
      channelId = item?.id?.channelId;
      if (!channelId) return res.status(404).json({ error: 'Channel not found' });
    }

    // Now fetch stats
    const stats = await fetchJson(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${key}`
    );
    const ch = stats?.items?.[0];
    if (!ch) return res.status(404).json({ error: 'Channel statistics not found' });

    const s = ch.statistics || {};
    const sn = ch.snippet || {};

    res.status(200).json({
      channelId,
      title: sn.title || '',
      handle: sn.customUrl || '',
      subscribers: s.hiddenSubscriberCount ? null : Number(s.subscriberCount || 0),
      views: Number(s.viewCount || 0),
      videoCount: Number(s.videoCount || 0)
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
