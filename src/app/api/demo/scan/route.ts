import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

/**
 * POST /api/demo/scan
 *
 * Sauvegarde les données du formulaire de démo dans DemoScan.
 * Calcule expiresAt = maintenant + 2 heures (auto-suppression).
 *
 * Body:
 *   finderName: string (requis)
 *   finderPhone: string (requis)
 *   location?: string
 *   mapsLink?: string
 *   message?: string
 *
 * Retourne:
 *   { success: true, id, expiresAt }
 */
const schema = z.object({
  finderName: z.string().min(1, 'Nom requis'),
  finderPhone: z.string().min(6, 'Numéro WhatsApp invalide'),
  location: z.string().optional().nullable(),
  mapsLink: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 heures

    const demoScan = await db.demoScan.create({
      data: {
        reference: 'DEMO-TEST',
        finderName: data.finderName.trim(),
        finderPhone: data.finderPhone.trim(),
        location: data.location || null,
        mapsLink: data.mapsLink || null,
        message: data.message || null,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      id: demoScan.id,
      expiresAt: demoScan.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[demo/scan] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
