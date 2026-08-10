import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/service-templates
 * Récupère le catalogue de services templates (global + agence)
 * ?pack=urban|resort|bnb → filtre par pack
 * ?agencyId=xxx → inclut les templates personnalisés de l'agence
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pack = searchParams.get('pack');
  const agencyId = searchParams.get('agencyId');

  try {
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { agencyId: null }, // templates globaux
        ...(agencyId ? [{ agencyId }] : []), // templates personnalisés de l'agence
      ],
    };

    if (pack) {
      where.pack = pack;
    }

    const templates = await db.serviceTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('[api/service-templates] Error:', error);
    return NextResponse.json({ success: true, templates: [] });
  }
}
