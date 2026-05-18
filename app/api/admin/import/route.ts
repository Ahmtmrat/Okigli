import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Papa from 'papaparse';
import { isAdmin } from '@/lib/auth';
import { generateToken } from '@/lib/token';

export const runtime = 'nodejs';

type Row = { full_name?: string; salutation?: string; phone?: string };

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const text = await req.text();
  if (!text.trim()) return NextResponse.json({ error: 'Boş CSV' }, { status: 400 });

  const parsed = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return NextResponse.json({ error: 'CSV parse hatası: ' + parsed.errors[0].message }, { status: 400 });
  }

  const errors: string[] = [];
  let inserted = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const fullName = (row.full_name ?? '').toString().trim();
    const salutation = (row.salutation ?? '').toString().trim() || fullName;
    const phone = ((row.phone ?? '').toString().trim() || null);

    if (!fullName) {
      errors.push(`Satır ${i + 2}: full_name boş`);
      continue;
    }
    if (fullName.length > 200 || salutation.length > 200) {
      errors.push(`Satır ${i + 2}: isim çok uzun`);
      continue;
    }
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
    if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
      errors.push(`Satır ${i + 2}: telefon geçersiz (${phone})`);
      continue;
    }

    // Mükerrer kontrolü: aynı isim + telefon varsa atla
    const dupQuery = cleanPhone
      ? await sql`SELECT token FROM invitees WHERE full_name = ${fullName} AND phone = ${cleanPhone} LIMIT 1`
      : await sql`SELECT token FROM invitees WHERE full_name = ${fullName} AND phone IS NULL LIMIT 1`;
    if (dupQuery.rows.length > 0) {
      errors.push(`Satır ${i + 2}: "${fullName}" zaten var`);
      continue;
    }

    // Token üret - çakışırsa tekrar dene
    let token = generateToken();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await sql`SELECT 1 FROM invitees WHERE token = ${token} LIMIT 1`;
      if (exists.rows.length === 0) break;
      token = generateToken();
    }

    try {
      await sql`
        INSERT INTO invitees (token, full_name, salutation, phone)
        VALUES (${token}, ${fullName}, ${salutation}, ${cleanPhone})
      `;
      inserted++;
    } catch (e: any) {
      errors.push(`Satır ${i + 2}: DB hatası - ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true, inserted, errors });
}
