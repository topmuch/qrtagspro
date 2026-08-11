import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/modeles-appareils?q=nespresso&category=coffee
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const category = searchParams.get('category');

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { searchKey: { contains: q } },
      { brand: { contains: q } },
      { model: { contains: q } },
    ];
  }

  const modeles = await db.modeleAppareil.findMany({
    where,
    take: 20,
    orderBy: { brand: 'asc' },
  });

  return NextResponse.json({ success: true, modeles });
}
