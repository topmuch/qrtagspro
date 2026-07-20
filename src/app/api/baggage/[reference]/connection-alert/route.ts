import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({ where: { reference } });
    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Alerte traitée' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
