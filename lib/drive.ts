import { google } from 'googleapis';
import { Readable } from 'stream';

function getOAuth2Client() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google Drive env değişkenleri eksik');
  }
  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getOAuth2Client() });
}

export async function uploadToDrive(opts: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  parentFolderId?: string;
}): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const drive = getDriveClient();
  const folderId = opts.parentFolderId ?? process.env.DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('DRIVE_FOLDER_ID eksik');

  const res = await drive.files.create({
    requestBody: {
      name: opts.fileName,
      parents: [folderId],
      mimeType: opts.mimeType,
    },
    media: {
      mimeType: opts.mimeType,
      body: Readable.from(opts.buffer),
    },
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  return {
    id: res.data.id ?? '',
    webViewLink: res.data.webViewLink ?? '',
    webContentLink: res.data.webContentLink ?? '',
  };
}

/**
 * Davetli için alt klasör oluşturur (ya da varsa döner).
 * Klasör adı: "AdSoyad (token)".
 */
export async function ensureGuestFolder(displayName: string, token: string): Promise<string> {
  const drive = getDriveClient();
  const rootId = process.env.DRIVE_FOLDER_ID;
  if (!rootId) throw new Error('DRIVE_FOLDER_ID eksik');

  const folderName = `${displayName} (${token})`;

  // Var olan var mı bak
  const q = `'${rootId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const existing = await drive.files.list({
    q,
    fields: 'files(id, name)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (existing.data.files?.length) return existing.data.files[0].id!;

  // Yoksa oluştur
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });
  return created.data.id!;
}

export async function listDriveFiles(): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime: string;
  size?: string;
  parents?: string[];
}>> {
  const drive = getDriveClient();
  const rootId = process.env.DRIVE_FOLDER_ID;
  if (!rootId) throw new Error('DRIVE_FOLDER_ID eksik');

  // Tüm alt klasörlerdeki dosyaları al (sadece direkt çocuklar değil, recursive)
  // Basitlik için Vercel Postgres'teki 'memories' tablosundan da çekebilirsin.
  // Burada direkt rooot altındaki klasörleri ve içlerini listeliyoruz.
  const all: any[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${rootId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    all.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  const folderIds = all.filter(f => f.mimeType === 'application/vnd.google-apps.folder').map(f => f.id);
  const directFiles = all.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

  const files: any[] = [...directFiles];
  for (const fid of folderIds) {
    const res = await drive.files.list({
      q: `'${fid}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, size, parents)',
      pageSize: 200,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(res.data.files ?? []));
  }
  return files.sort((a, b) => (b.createdTime ?? '').localeCompare(a.createdTime ?? ''));
}
