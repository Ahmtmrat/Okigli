import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    SELECT id, invitee_token, uploader_name, drive_file_id, drive_url, file_name, file_type, file_size, created_at
    FROM memories
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ items: rows });
}
