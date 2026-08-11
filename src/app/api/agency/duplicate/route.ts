import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/agency/duplicate — Duplique la config complète d'un logement
// Body: { sourceAgencyId, newName, newSlug, newAddress? }
//
// Copie : houseGuide, hotelServices, teams, serviceTemplates personnalisés,
//         hotelPartners, braceletProfile, agencyType, etc.
// Ne copie PAS : users, commandes (ServiceRequest), bracelets (Baggage),
//                LostItems, Stay, PersonBracelet (données opérationnelles)
export async function POST(req: NextRequest) {
  try {
    // Auth: agency uniquement
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { newName, newSlug, newAddress } = body;

    if (!newName?.trim() || !newSlug?.trim()) {
      return NextResponse.json({ error: 'Nom et slug requis' }, { status: 400 });
    }

    // Check slug unique
    const existing = await db.agency.findUnique({ where: { slug: newSlug } });
    if (existing) {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 400 });
    }

    const source = await db.agency.findUnique({
      where: { id: user.agencyId },
      include: {
        houseGuide: true,
        hotelServices: true,
        teams: true,
        serviceTemplates: { where: { agencyId: user.agencyId } },
        hotelPartners: true,
      },
    });

    if (!source) return NextResponse.json({ error: 'Agence source introuvable' }, { status: 404 });

    // 1. Create new agency
    const newAgency = await db.agency.create({
      data: {
        name: newName.trim(),
        slug: newSlug.trim(),
        email: source.email,
        phone: source.phone,
        contactPhone: source.contactPhone,
        address: newAddress || source.address,
        logoUrl: source.logoUrl,
        agencyType: source.agencyType,
        braceletProfile: source.braceletProfile,
        latitude: source.latitude,
        longitude: source.longitude,
        pmsProvider: source.pmsProvider,
        pmsApiKeys: source.pmsApiKeys,
        pmsPropertyId: source.pmsPropertyId,
        active: true,
      },
    });

    // 2. Lie l'utilisateur courant au nouveau logement (peut switcher entre les deux)
    await db.user.update({
      where: { id: user.id },
      data: { agencyId: newAgency.id },
    });

    // 3. Duplique HouseGuide (si existe)
    if (source.houseGuide) {
      const g = source.houseGuide;
      await db.houseGuide.create({
        data: {
          agencyId: newAgency.id,
          wifiNetwork: g.wifiNetwork,
          wifiPassword: g.wifiPassword,
          houseRules: g.houseRules,
          checkInTime: g.checkInTime,
          checkOutTime: g.checkOutTime,
          checkInInstructions: g.checkInInstructions,
          checkOutInstructions: g.checkOutInstructions,
          homeTutorials: g.homeTutorials,
          hostRecommendations: g.hostRecommendations,
          hostName: g.hostName,
          hostPhone: g.hostPhone,
          hostWelcomeMessage: g.hostWelcomeMessage,
          photos: g.photos,
          isActive: g.isActive,
        },
      });
    }

    // 4. Duplique Teams
    for (const team of source.teams) {
      await db.team.create({
        data: {
          agencyId: newAgency.id,
          category: team.category,
          email: team.email,
          label: team.label,
        },
      });
    }

    // 5. Duplique HotelServices (avec modeleId, photoCustom, etapes, etc.)
    for (const s of source.hotelServices) {
      await db.hotelService.create({
        data: {
          agencyId: newAgency.id,
          name: s.name,
          description: s.description,
          icon: s.icon,
          type: s.type,
          category: s.category,
          isActive: s.isActive,
          isFree: s.isFree,
          price: s.price,
          schedule: s.schedule,
          slots: s.slots,
          menu: s.menu,
          assignedTeam: s.assignedTeam,
          displayTab: s.displayTab,
          modeleId: s.modeleId,
          photoCustom: s.photoCustom,
          videoUrl: s.videoUrl,
          etapes: s.etapes,
          depannage: s.depannage,
        },
      });
    }

    // 6. Duplique ServiceTemplates personnalisés (pas les globaux)
    for (const t of source.serviceTemplates) {
      await db.serviceTemplate.create({
        data: {
          agencyId: newAgency.id,
          name: t.name, nameEn: t.nameEn, nameEs: t.nameEs,
          description: t.description, descriptionEn: t.descriptionEn, descriptionEs: t.descriptionEs,
          icon: t.icon, type: t.type, category: t.category,
          displayTab: t.displayTab, assignedTeam: t.assignedTeam,
          isFree: t.isFree, defaultPrice: t.defaultPrice,
          defaultSchedule: t.defaultSchedule, pack: t.pack, isActive: t.isActive,
        },
      });
    }

    // 7. Duplique HotelPartners
    for (const p of source.hotelPartners) {
      await db.hotelPartner.create({
        data: {
          agencyId: newAgency.id,
          name: p.name, category: p.category,
          description: p.description,
          latitude: p.latitude, longitude: p.longitude,
          rating: p.rating,
          promoCode: p.promoCode,
          commission: p.commission,
          isVerified: p.isVerified,
          isActive: p.isActive,
        },
      });
    }

    return NextResponse.json({
      success: true,
      newAgencyId: newAgency.id,
      newSlug: newAgency.slug,
      copied: {
        services: source.hotelServices.length,
        teams: source.teams.length,
        templates: source.serviceTemplates.length,
        partners: source.hotelPartners.length,
        hasGuide: !!source.houseGuide,
      },
    });
  } catch (error) {
    console.error('[duplicate] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la duplication' }, { status: 500 });
  }
}
