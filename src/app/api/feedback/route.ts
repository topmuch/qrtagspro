import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// ─── Feedback in-app ───
// POST /api/feedback
// Body: { reference: string, type: 'bug'|'suggestion'|'question', message: string }

const feedbackSchema = z.object({
  reference: z.string().min(1).max(50),
  type: z.enum(['bug', 'suggestion', 'question']),
  message: z.string().min(5).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    // Stocker dans SystemLog (réutilise la table existante)
    await db.systemLog.create({
      data: {
        level: 'info',
        message: `[FEEDBACK] ${validated.type} — Ref: ${validated.reference}`,
        source: 'feedback',
        metadata: JSON.stringify({
          reference: validated.reference,
          type: validated.type,
          message: validated.message,
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'unknown',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Merci pour votre retour ! Notre équipe vous répondra rapidement.',
    });
  } catch (error) {
    console.error('[feedback] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Message trop court ou invalide' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
