import { notFound } from 'next/navigation';
import { getInviteeByToken } from '@/lib/db';
import { UploadClient } from './upload-client';

export const dynamic = 'force-dynamic';

export default async function UploadPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  if (!token || token.length < 6) notFound();

  const invitee = await getInviteeByToken(token);
  if (!invitee) notFound();

  return (
    <UploadClient
      token={invitee.token}
      salutation={invitee.salutation}
      fullName={invitee.full_name}
    />
  );
}
