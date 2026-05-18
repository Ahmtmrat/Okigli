import { randomBytes } from 'crypto';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // l, o, 0, 1 olmadan - okunabilir

export function generateToken(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
