import { sql } from '@vercel/postgres';

export { sql };

export type InviteeRow = {
  token: string;
  full_name: string;
  salutation: string;
  phone: string | null;
  status: 'accepted' | 'declined' | null;
  responded_at: string | null;
  created_at: string;
};

export type GuestRow = {
  id: number;
  invitee_token: string;
  full_name: string;
  created_at: string;
};

export async function getInviteeByToken(token: string): Promise<InviteeRow | null> {
  const { rows } = await sql<InviteeRow>`
    SELECT token, full_name, salutation, phone, status, responded_at, created_at
    FROM invitees
    WHERE token = ${token}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getGuestsByToken(token: string): Promise<GuestRow[]> {
  const { rows } = await sql<GuestRow>`
    SELECT id, invitee_token, full_name, created_at
    FROM guests
    WHERE invitee_token = ${token}
    ORDER BY id ASC
  `;
  return rows;
}
