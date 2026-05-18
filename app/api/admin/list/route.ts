import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: invitees } = await sql<{
    token: string; full_name: string; salutation: string; phone: string | null;
    status: 'accepted' | 'declined' | null; responded_at: string | null;
  }>`
    SELECT token, full_name, salutation, phone, status, responded_at
    FROM invitees
    ORDER BY status NULLS FIRST, full_name ASC
  `;

  const { rows: guests } = await sql<{ invitee_token: string; full_name: string }>`
    SELECT invitee_token, full_name FROM guests ORDER BY id ASC
  `;

  const guestsByToken: Record<string, string[]> = {};
  for (const g of guests) {
    (guestsByToken[g.invitee_token] ??= []).push(g.full_name);
  }

  const items = invitees.map(i => ({ ...i, guests: guestsByToken[i.token] ?? [] }));
  return NextResponse.json({ items });
}
