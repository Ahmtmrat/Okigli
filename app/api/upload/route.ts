import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureGuestFolder, uploadToDrive } from '@/lib/drive';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const token = (form.get('token') as string | null)?.trim() ?? '';
    const message = ((form.get('message') as string | null) ?? '').trim();

    if (!file || !token) return NextResponse.json({ error: 'Eksik veri' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Dosya çok büyük' }, { status: 413 });

    // Davetli var mı?
    const { rows } = await sql<{ token: string; full_name: string }>`
      SELECT token, full_name FROM invitees WHERE token = ${token} LIMIT 1
    `;
    const invitee = rows[0];
    if (!invitee) return NextResponse.json({ error: 'Davetli bulunamadı' }, { status: 404 });

    // Drive klasörü hazırla
    const folderId = await ensureGuestFolder(invitee.full_name, token);

    // Dosyayı al
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${sanitize(file.name)}`;

    const result = await uploadToDrive({
      fileName: safeName,
      mimeType: file.type || 'application/octet-stream',
      buffer,
      parentFolderId: folderId,
    });

    // DB'ye log
    await sql`
      INSERT INTO memories (invitee_token, uploader_name, drive_file_id, drive_url, file_name, file_type, file_size)
      VALUES (${token}, ${invitee.full_name}, ${result.id}, ${result.webViewLink}, ${file.name}, ${file.type}, ${file.size})
    `;

    return NextResponse.json({ ok: true, id: result.id, url: result.webViewLink });
  } catch (e: any) {
    console.error('upload error', e);
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 });
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}
