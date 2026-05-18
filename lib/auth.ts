import { NextRequest } from 'next/server';

export function isAdmin(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key') ?? req.headers.get('x-admin-key');
  if (!key) return false;
  if (!process.env.ADMIN_KEY) return false;
  // Sabit zamanda karşılaştırma
  return safeEqual(key, process.env.ADMIN_KEY);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
