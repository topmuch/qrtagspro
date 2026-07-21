import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import {
  getPMSConfig,
  updatePMSConfig,
  removePMSConfig,
  testPMSConnection,
} from '@/lib/pms/pmsService';
import { PMSProviderType } from '@/lib/pms/types';

/**
 * GET /api/agency/pms?agencyId=X
 * Retourne la config PMS d'une agence (clé API masquée).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId requis' }, { status: 400 });
    }

    const config = await getPMSConfig(agencyId);

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[PMS GET] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

const updateSchema = z.object({
  agencyId: z.string().min(1),
  provider: z.enum(['CLOUDBEDS', 'MEWS', 'SIRVOY', 'NONE']),
  apiKey: z.string().min(1),
  propertyId: z.string().min(1),
  baseUrl: z.string().optional().nullable(),
});

/**
 * PUT /api/agency/pms
 * Met à jour la config PMS d'une agence.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    await updatePMSConfig(data.agencyId, {
      provider: data.provider as PMSProviderType,
      apiKey: data.apiKey,
      propertyId: data.propertyId,
      baseUrl: data.baseUrl || undefined,
    });

    return NextResponse.json({ success: true, message: 'Configuration PMS mise à jour' });
  } catch (error) {
    console.error('[PMS PUT] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/agency/pms?agencyId=X
 * Supprime la config PMS d'une agence.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId requis' }, { status: 400 });
    }

    await removePMSConfig(agencyId);

    return NextResponse.json({ success: true, message: 'Configuration PMS supprimée' });
  } catch (error) {
    console.error('[PMS DELETE] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/agency/pms
 * Teste la connexion PMS.
 * Body: { agencyId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agencyId = body?.agencyId;

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId requis' }, { status: 400 });
    }

    const result = await testPMSConnection(agencyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PMS POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
