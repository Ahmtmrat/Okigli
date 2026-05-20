import { redirect } from 'next/navigation';

type Params = { token: string };

export default async function DavetPage(props: { params: Promise<Params> }) {
  const { token } = await props.params;
  redirect(`/?token=${encodeURIComponent(token)}`);
}
