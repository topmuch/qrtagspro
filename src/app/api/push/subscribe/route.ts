import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { VAPID_PUBLIC_KEY } from '@/lib/web-push';

// ─── Push Subscription ───
// POST /api/push/subscribe
// Body: { reference: string, subscription: PushSubscription }
// GET /api/push/subscribe → returns VAPID public key

const subscribeSchema = z.object({
  reference: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

function getSubFile(): string {
  const dbDir = (process.env.DATABASE_URL || 'file:/app/data/qrlabs.db')
    .replace('file:', '')
    .replace(/[^/]+$/, '');
  return path.join(dbDir || '/app/data/', 'push-subscriptions.json');
}

export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    const subFile = getSubFile();
    const dir = path.dirname(subFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing subscriptions
    let subs: Array<{ reference: string; subscription: z.infer<typeof subscribeSchema>['subscription'] }> = [];
    if (fs.existsSync(subFile)) {
      subs = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
    }

    // Check if already subscribed (same endpoint + reference)
    const exists = subs.some(
      s => s.reference === validated.reference && s.subscription.endpoint === validated.subscription.endpoint
    );

    if (!exists) {
      subs.push({ reference: validated.reference, subscription: validated.subscription });
      fs.writeFileSync(subFile, JSON.stringify(subs, null, 2));
    }

    return NextResponse.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('[push/subscribe] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
