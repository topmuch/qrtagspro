import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let agencyId = searchParams.get('agencyId');
  if (!agencyId || agencyId === 'auto') {
    try { const { getSession } = await import('@/lib/session'); const u = await getSession(); agencyId = u?.agencyId; } catch {}
  }
  if (!agencyId) return NextResponse.json({ success: true, items: [] });
  try {
    const items = await db.lostItem.findMany({ where: { agencyId }, orderBy: { foundDate: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, items });
  } catch (e) { return NextResponse.json({ success: true, items: [] }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let agencyId = body.agencyId;
    if (!agencyId) { const { getSession } = await import('@/lib/session'); const u = await getSession(); agencyId = u?.agencyId; }
    if (!agencyId) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
    const item = await db.lostItem.create({ data: { agencyId, name: body.name || 'Objet', category: body.category || 'other', description: body.description || null, photoUrl: body.photoUrl || null, foundLocation: body.foundLocation || null, foundBy: body.foundBy || null, status: 'found' } });
    return NextResponse.json({ success: true, itemId: item.id });
  } catch (e) { return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'); const status = searchParams.get('status'); const claimedBy = searchParams.get('claimedBy');
  if (!id || !status) return NextResponse.json({ error: 'id+status requis' }, { status: 400 });
  try {
    const data: Record<string, unknown> = { status };
    if (status === 'claimed') { data.claimedBy = claimedBy; data.claimedDate = new Date(); }
    if (status === 'returned') data.returnedDate = new Date();
    await db.lostItem.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  try { await db.lostItem.delete({ where: { id } }); return NextResponse.json({ success: true }); }
  catch (e) { return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}
