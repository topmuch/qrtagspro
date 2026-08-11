import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// POST /api/person-bracelet/alert — partage position + email alerte
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { personBraceletId, latitude, longitude, finderName, finderPhone, finderMessage } = body;

  if (!personBraceletId || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const person = await db.personBracelet.findUnique({
    where: { id: personBraceletId },
    include: { baggage: true },
  });
  if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 });

  // Save position alert
  const alert = await db.positionAlert.create({
    data: {
      personBraceletId,
      latitude, longitude,
      finderName, finderPhone, finderMessage,
    },
  });

  // Update person status
  await db.personBracelet.update({
    where: { id: personBraceletId },
    data: {
      status: 'found',
      lastSeenAt: new Date(),
      lastSeenLocation: `${latitude},${longitude}`,
    },
  });

  // Send email alert to emergency contacts
  let emailRecipients = '';
  if (person.emergencyContacts) {
    try {
      const contacts = JSON.parse(person.emergencyContacts);
      const emails = contacts.map((c: { email?: string }) => c.email).filter(Boolean);
      if (emails.length > 0) {
        emailRecipients = emails.join(',');
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const lang = person.language || 'fr';
        const subject = lang === 'en'
          ? `[URGENT] ${person.personName} found`
          : lang === 'es'
          ? `[URGENTE] ${person.personName} encontrado`
          : `[URGENT] ${person.personName} retrouvé`;

        const text = lang === 'en'
          ? `A finder has located ${person.personName}.\n\nLocation: ${mapsLink}\nFinder: ${finderName || 'Anonymous'} (${finderPhone || 'no phone'})\nMessage: ${finderMessage || '—'}\n\nPlease contact them ASAP.`
          : lang === 'es'
          ? `Un usuario ha encontrado a ${person.personName}.\n\nUbicación: ${mapsLink}\nUsuario: ${finderName || 'Anónimo'} (${finderPhone || 'sin teléfono'})\nMensaje: ${finderMessage || '—'}\n\nPor favor contáctelo lo antes posible.`
          : `Une personne a retrouvé ${person.personName}.\n\nPosition : ${mapsLink}\nTrouveur : ${finderName || 'Anonyme'} (${finderPhone || 'pas de téléphone'})\nMessage : ${finderMessage || '—'}\n\nMerci de le contacter dans les plus brefs délais.`;

        await sendEmail({ to: emails, subject, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` });
      }
    } catch (e) {
      console.error('Email alert error:', e);
    }
  }

  await db.positionAlert.update({
    where: { id: alert.id },
    data: { emailSent: true, emailRecipients },
  });

  return NextResponse.json({ success: true, alert });
}
