import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

const MAX_GUESTS = 10;
const MAX_NAME_LEN = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { token?: string; status?: string; guests?: string[] } | null;
    if (!body?.token || !body.status) {
      return NextResponse.json({ error: 'Eksik veri' }, { status: 400 });
    }
    if (body.status !== 'accepted' && body.status !== 'declined') {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    // Davetli var mı + zaten yanıt vermiş mi
    const { rows } = await sql<{ token: string; status: string | null }>`
      SELECT token, status FROM invitees WHERE token = ${body.token} LIMIT 1
    `;
    const invitee = rows[0];
    if (!invitee) return NextResponse.json({ error: 'Davetli bulunamadı' }, { status: 404 });
    if (invitee.status) {
      return NextResponse.json({ error: 'Yanıtınız zaten alınmış' }, { status: 409 });
    }

    // Yanıtı işle - transactional değil ama race condition için status'u şart koş
    if (body.status === 'declined') {
      await sql`
        UPDATE invitees
        SET status = 'declined', responded_at = NOW()
        WHERE token = ${body.token} AND status IS NULL
      `;
    } else {
      // accepted - guest listesini temizle ve yaz
      const cleaned = (body.guests ?? [])
        .map(s => String(s).trim())
        .filter(s => s.length > 0 && s.length <= MAX_NAME_LEN)
        .slice(0, MAX_GUESTS);

      await sql`
        UPDATE invitees
        SET status = 'accepted', responded_at = NOW()
        WHERE token = ${body.token} AND status IS NULL
      `;

      if (cleaned.length > 0) {
        // Insert guests - tek tek, basit
        for (const name of cleaned) {
          await sql`
            INSERT INTO guests (invitee_token, full_name)
            VALUES (${body.token}, ${name})
          `;
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('rsvp error', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
