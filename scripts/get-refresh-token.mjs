// Tek seferlik çalıştırılır: refresh token alıp env'e yapıştırılacak
// Kullanım: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-refresh-token.mjs

import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET ortam değişkenlerini ver.');
  console.error('Örnek: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-refresh-token.mjs');
  process.exit(1);
}

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;

const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT);

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('\n🌐 Tarayıcında şu URL\'i aç ve giriş yap:\n');
console.log(url);
console.log('\nDinleniyor: ' + REDIRECT + '\n');

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, REDIRECT);
    const code = u.searchParams.get('code');
    if (!code) {
      res.writeHead(400);
      res.end('No code in URL');
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>✅ Tamam, terminale geri dön.</h1>');

    console.log('\n✅ Token alındı:\n');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\nBunu Vercel proje > Settings > Environment Variables\'a ekle.');
    console.log('Dikkat: refresh token sadece bu sefer gösterilir, kaybedersen tekrar çalıştır.\n');

    server.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Hata:', e.message);
    res.writeHead(500);
    res.end('Error: ' + e.message);
  }
});

server.listen(PORT);
