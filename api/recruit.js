// api/recruit.js
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_IP = 1;
const ipRequests = new Map(); // resets when function cold starts

export async function POST(req) {
  try {
    // Extract IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    const now = Date.now();
    const entry = ipRequests.get(ip) || { count: 0, start: now };

    // Reset count if 24h window passed
    if (now - entry.start > RATE_LIMIT_WINDOW) {
      entry.count = 0;
      entry.start = now;
    }

    entry.count++;
    ipRequests.set(ip, entry);

    // Block if exceeded 1 per day
    if (entry.count > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        { error: 'You can only submit once per day. Try again tomorrow.' },
        { status: 429 }
      );
    }

    // Parse submitted data
    const data = await req.json();

    // === Discord relay ===
    const discordWebhook =
      process.env.DISCORD_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/...'; // replace with yours

    const embed = {
      title: '🎯 New Recruitment Submission',
      color: 16766720, // gold tone
      fields: Object.entries(data).map(([k, v]) => ({
        name: k,
        value: v || '—',
        inline: false
      })),
      timestamp: new Date().toISOString()
    };

    await fetch(discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Recruit API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
