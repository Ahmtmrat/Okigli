import { NextRequest, NextResponse } from 'next/server';
import { getInviteeByToken } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() ?? '';
  if (!token || token.length < 6) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 });
  }
  const invitee = await getInviteeByToken(token);
  if (!invitee) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({
    token: invitee.token,
    salutation: invitee.salutation,
    fullName: invitee.full_name,
    status: invitee.status,
  });
}
