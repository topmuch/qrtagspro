import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const unsubscribeSchema = z.object({
  reference: z.string().min(1),
  endpoint: z.string(),
});

function getSubFile(): string {
  const dbDir = (process.env.DATABASE_URL || 'file:/app/data/qrlags.db')
    .replace('file:', '')
    .replace(/[^/]+$/, '');
  return path.join(dbDir || '/app/data/', 'push-subscriptions.json');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = unsubscribeSchema.parse(body);

    const subFile = getSubFile();
    if (!fs.existsSync(subFile)) {
      return NextResponse.json({ success: true });
    }

    let subs: Array<{ reference: string; subscription: { endpoint: string } }> = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
    subs = subs.filter(
      s => !(s.reference === validated.reference && s.subscription.endpoint === validated.endpoint)
    );
    fs.writeFileSync(subFile, JSON.stringify(subs, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[push/unsubscribe] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
