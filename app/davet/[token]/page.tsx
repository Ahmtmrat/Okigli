import { notFound } from 'next/navigation';
import { getGuestsByToken, getInviteeByToken } from '@/lib/db';
import { WEDDING } from '@/lib/venue';
import { RsvpClient } from './rsvp-client';

type Params = { token: string };

export const dynamic = 'force-dynamic';

export default async function DavetPage(props: { params: Promise<Params> }) {
  const { token } = await props.params;
  if (!token || token.length < 6) notFound();

  const invitee = await getInviteeByToken(token);
  if (!invitee) notFound();

  const guests = invitee.status === 'accepted' ? await getGuestsByToken(token) : [];

  return (
    <RsvpClient
      token={invitee.token}
      salutation={invitee.salutation}
      fullName={invitee.full_name}
      status={invitee.status}
      existingGuests={guests.map(g => g.full_name)}
      weddingDate={`${WEDDING.dateText} · ${WEDDING.dayText} · ${WEDDING.timeText}`}
    />
  );
}
