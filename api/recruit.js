// api/recruit.js (Node / Vercel Edge Function)
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_IP = 3;
const ipRequests = new Map(); // ephemeral memory (resets on function cold start)

export async function POST(req) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    const now = Date.now();
    const entry = ipRequests.get(ip) || { count: 0, start: now };

    if (now - entry.start > RATE_LIMIT_WINDOW) {
      entry.count = 0;
      entry.start = now;
    }
    entry.count++;
    ipRequests.set(ip, entry);

    if (entry.count > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        { error: 'Too many submissions. Try again later.' },
        { status: 429 }
      );
    }

    // Parse incoming JSON body
    const data = await req.json();

    // Example: Relay to Discord (or your existing logic)
    const discordWebhook =
      process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/...';
    const msg = {
      embeds: [
        {
          title: '🎯 New Recruitment Submission',
          color: 16766720, // gold-ish
          fields: Object.entries(data).map(([k, v]) => ({
            name: k,
            value: v || '—',
            inline: false
          })),
          timestamp: new Date().toISOString()
        }
      ]
    };
    await fetch(discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Recruit API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
