'use client';

import { useState } from 'react';
import { VenueCard } from '@/components/VenueCard';
import { GuestModal } from '@/components/GuestModal';

type Props = {
  token: string;
  salutation: string;
  fullName: string;
  status: 'accepted' | 'declined' | null;
  existingGuests: string[];
  weddingDate: string;
};

export function RsvpClient({ token, salutation, fullName, status: initialStatus, existingGuests, weddingDate }: Props) {
  const [status, setStatus] = useState<'accepted' | 'declined' | null>(initialStatus);
  const [guests, setGuests] = useState<string[]>(existingGuests);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<null | 'accept' | 'decline'>(null);
  const [error, setError] = useState('');

  const submit = async (st: 'accepted' | 'declined', guestNames: string[] = []) => {
    setError('');
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, status: st, guests: guestNames }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Bir hata oluştu');
    }
  };

  const handleDecline = async () => {
    if (pending) return;
    setPending('decline');
    try {
      await submit('declined');
      setStatus('declined');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  };

  const handleAcceptClick = () => {
    if (pending) return;
    setError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (names: string[]) => {
    try {
      await submit('accepted', names);
      setGuests(names);
      setStatus('accepted');
      setModalOpen(false);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  // Kilitli ekran (zaten yanıt verilmiş)
  if (status) {
    return <LockedView status={status} salutation={salutation} guests={guests} token={token} />;
  }

  // Açık ekran
  return (
    <main className="page">
      <div className="container fade-up">
        <header>
          <p className="eyebrow" style={{ marginBottom: 20 }}>{weddingDate}</p>
          <p className="greeting">Merhaba {salutation},</p>
          <h1 className="serif title">
            Diba <em>&</em> Kadir
          </h1>
          <div className="ornament" aria-hidden="true">
            <span /><span className="diamond">✦</span><span />
          </div>
          <p className="invite-text">
            Hayatımızın en güzel gününde sizi aramızda görmek
            <br />bizi çok mutlu edecek.
          </p>
        </header>

        {error && <p className="error">{error}</p>}

        <div className="cta">
          <button
            className="btn-accept"
            onClick={handleAcceptClick}
            disabled={!!pending}
          >
            Katılacağım
          </button>
          <button
            className="btn-decline"
            onClick={handleDecline}
            disabled={!!pending}
          >
            {pending === 'decline' ? 'Gönderiliyor…' : 'Maalesef katılamıyorum'}
          </button>
        </div>

        <VenueCard />

        <footer>
          <p style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 48 }}>
            Doğan & Yıldırım Aileleri
          </p>
        </footer>
      </div>

      <GuestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        salutation={salutation}
      />

      <PageStyles />
    </main>
  );
}

function LockedView({ status, salutation, guests, token }: { status: 'accepted' | 'declined'; salutation: string; guests: string[]; token: string }) {
  return (
    <main className="page">
      <div className="container fade-up" style={{ textAlign: 'center' }}>
        {status === 'accepted' ? (
          <>
            <div className="seal" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Yanıtınız alındı</p>
            <h1 className="serif" style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.1, marginBottom: 16 }}>
              Sizi bekliyoruz<em style={{ color: 'var(--blue)', fontWeight: 400 }}>.</em>
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: guests.length ? 24 : 32 }}>
              Teşekkürler {salutation} — kıymetli gününüzü bizimle paylaştığınız için.
            </p>

            {guests.length > 0 && (
              <div className="guest-pill-wrap">
                <p className="eyebrow" style={{ fontSize: 10, marginBottom: 12 }}>Yanınızda gelenler</p>
                <div className="pills">
                  {guests.map((g, i) => <span key={i} className="pill">{g}</span>)}
                </div>
              </div>
            )}

            <a href={`/upload/${token}`} className="memory-link">
              Düğünden bir anınızı paylaşmak ister misiniz? →
            </a>

            <VenueCard />
          </>
        ) : (
          <>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Yanıtınız alındı</p>
            <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.15, marginBottom: 20 }}>
              Anlayışla karşılıyoruz<em style={{ color: 'var(--blue)', fontWeight: 400 }}>.</em>
            </h1>
            <p style={{ color: 'var(--muted)', maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
              {salutation}, bu özel günde yanımızda olamayacak olmanız bizi üzdü.
              <br />
              Sevgi ve saygıyla,
            </p>
            <p className="serif" style={{ fontSize: 20, marginTop: 24, color: 'var(--blue)' }}>
              Diba & Kadir
            </p>
          </>
        )}
      </div>
      <PageStyles />
    </main>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      .page {
        min-height: 100vh;
        padding: 56px 20px 80px;
        position: relative;
        z-index: 1;
      }
      .container {
        max-width: 540px;
        margin: 0 auto;
      }
      .greeting {
        font-size: 15px;
        color: var(--muted);
        text-align: center;
        margin-bottom: 8px;
        font-style: italic;
      }
      .title {
        text-align: center;
        font-size: clamp(60px, 14vw, 92px);
        font-weight: 300;
        line-height: 0.95;
        letter-spacing: -0.025em;
      }
      .title em {
        font-style: italic;
        font-weight: 400;
        color: var(--blue);
      }
      .ornament {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin: 28px 0 20px;
      }
      .ornament span:not(.diamond) {
        flex: 0 0 60px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--blue) 50%, transparent);
      }
      .ornament .diamond {
        color: var(--blue);
        font-size: 14px;
        line-height: 1;
      }
      .invite-text {
        text-align: center;
        color: var(--ink);
        opacity: 0.78;
        font-size: 16px;
        line-height: 1.7;
        margin-bottom: 40px;
      }
      .cta {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .btn-accept, .btn-decline {
        padding: 18px 24px;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.2s;
      }
      .btn-accept {
        background: var(--blue);
        color: white;
        box-shadow: 0 8px 24px -8px rgba(41, 100, 195, 0.5);
      }
      .btn-accept:hover:not(:disabled) {
        background: var(--blue-soft);
        transform: translateY(-1px);
        box-shadow: 0 12px 32px -8px rgba(41, 100, 195, 0.6);
      }
      .btn-accept:active:not(:disabled) { transform: translateY(0); }
      .btn-decline {
        background: transparent;
        color: var(--muted);
        border: 1px solid var(--line);
      }
      .btn-decline:hover:not(:disabled) {
        background: var(--paper);
        color: var(--ink);
      }
      .btn-accept:disabled, .btn-decline:disabled { opacity: 0.5; cursor: not-allowed; }

      .error {
        background: rgba(179, 64, 54, 0.08);
        color: var(--error);
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        font-size: 14px;
        text-align: center;
        margin-bottom: 16px;
      }

      .seal {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        border-radius: 50%;
        background: var(--light-blue);
        color: var(--blue);
        display: grid;
        place-items: center;
        animation: sealIn 0.6s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes sealIn {
        from { opacity: 0; transform: scale(0.5) rotate(-12deg); }
        to   { opacity: 1; transform: scale(1) rotate(0); }
      }

      .guest-pill-wrap { margin: 28px 0 8px; }
      .pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .pill {
        padding: 7px 14px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 999px;
        font-size: 13px;
        color: var(--ink);
      }

      .memory-link {
        display: inline-block;
        margin-top: 28px;
        color: var(--blue);
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        padding: 12px 0;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;
      }
      .memory-link:hover { border-bottom-color: var(--blue); }
    `}</style>
  );
}
