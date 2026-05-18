'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Invitee = {
  token: string;
  full_name: string;
  salutation: string;
  phone: string | null;
  status: 'accepted' | 'declined' | null;
  responded_at: string | null;
  guests: string[];
};

export default function AdminPage() {
  const params = useSearchParams();
  const key = params.get('key') ?? '';
  const [data, setData] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [origin, setOrigin] = useState('');
  const [filter, setFilter] = useState<'all' | 'accepted' | 'declined' | 'pending'>('all');
  const [q, setQ] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    if (!key) { setErr('?key= parametresi gerekli'); setLoading(false); return; }
    fetch(`/api/admin/list?key=${encodeURIComponent(key)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setData(d.items))
      .catch(() => setErr('Yetkisiz veya hata oluştu'))
      .finally(() => setLoading(false));
  }, [key]);

  const stats = useMemo(() => {
    const total = data.length;
    const accepted = data.filter(d => d.status === 'accepted').length;
    const declined = data.filter(d => d.status === 'declined').length;
    const pending = data.filter(d => d.status === null).length;
    const totalAttending = data
      .filter(d => d.status === 'accepted')
      .reduce((sum, d) => sum + 1 + d.guests.length, 0);
    return { total, accepted, declined, pending, totalAttending };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (filter === 'accepted') list = list.filter(d => d.status === 'accepted');
    else if (filter === 'declined') list = list.filter(d => d.status === 'declined');
    else if (filter === 'pending') list = list.filter(d => d.status === null);
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(d =>
        d.full_name.toLowerCase().includes(term) ||
        d.salutation.toLowerCase().includes(term) ||
        (d.phone ?? '').includes(term)
      );
    }
    return list;
  }, [data, filter, q]);

  if (loading) return <main style={pageStyle}><p style={{ color: 'var(--muted)' }}>Yükleniyor…</p></main>;
  if (err) return <main style={pageStyle}><p style={{ color: 'var(--error)' }}>{err}</p></main>;

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Diba & Kadir · Admin</p>
          <h1 className="serif">Davetli Yönetimi</h1>
        </div>
        <div className="admin-nav">
          <a href={`/admin/import?key=${encodeURIComponent(key)}`}>+ Davetli Ekle (CSV)</a>
          <a href={`/admin/gallery?key=${encodeURIComponent(key)}`}>Galeri →</a>
        </div>
      </header>

      <section className="stats">
        <Stat label="Toplam davetli" value={stats.total} />
        <Stat label="Katılacak" value={stats.accepted} accent="blue" />
        <Stat label="Katılmayacak" value={stats.declined} />
        <Stat label="Yanıt yok" value={stats.pending} accent="muted" />
        <Stat label="Toplam katılım" value={stats.totalAttending} accent="big" />
      </section>

      <section className="controls">
        <input
          type="search"
          placeholder="Ara: isim, telefon…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="filter-tabs" role="tablist">
          {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Yanıt yok' : f === 'accepted' ? 'Katılacak' : 'Katılmayacak'}
            </button>
          ))}
        </div>
      </section>

      <section className="list">
        {filtered.map(it => <InviteeCard key={it.token} item={it} origin={origin} />)}
        {filtered.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Sonuç bulunamadı.</p>}
      </section>

      <Styles />
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'blue' | 'muted' | 'big' }) {
  return (
    <div className={`stat ${accent ? 'stat-' + accent : ''}`}>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

function InviteeCard({ item, origin }: { item: Invitee; origin: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${origin}/davet/${item.token}`;
  const waText = encodeURIComponent(
    `Merhaba ${item.salutation},\n\nDiba & Kadir'in düğününe davetlisiniz. Lütfen katılım durumunuzu aşağıdaki bağlantıdan bildirin:\n\n${link}`
  );
  const waUrl = item.phone ? `https://wa.me/${item.phone.replace(/\D/g, '')}?text=${waText}` : null;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className={`card status-${item.status ?? 'pending'}`}>
      <div className="card-head">
        <div>
          <h3>{item.full_name}</h3>
          <p className="card-sub">{item.salutation} {item.phone ? `· ${item.phone}` : ''}</p>
        </div>
        <StatusPill status={item.status} />
      </div>

      {item.status === 'accepted' && item.guests.length > 0 && (
        <div className="card-guests">
          <span className="card-guests-label">+{item.guests.length} kişi:</span>
          {item.guests.map((g, i) => <span key={i} className="guest-chip">{g}</span>)}
        </div>
      )}

      <div className="card-actions">
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener" className="action wa">
            <WAIcon /> WhatsApp Aç
          </a>
        )}
        <button onClick={copy} className="action">
          {copied ? '✓ Kopyalandı' : 'Mesajı Kopyala'}
        </button>
        <a href={link} target="_blank" rel="noopener" className="action ghost">
          Linki Aç
        </a>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: Invitee['status'] }) {
  if (status === 'accepted') return <span className="pill accepted">Katılacak</span>;
  if (status === 'declined') return <span className="pill declined">Katılmayacak</span>;
  return <span className="pill pending">Yanıt yok</span>;
}

function WAIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0012.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23z"/>
    </svg>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  position: 'relative',
  zIndex: 1,
  fontFamily: 'var(--body)',
};

function Styles() {
  return (
    <style jsx global>{`
      .admin {
        max-width: 1100px;
        margin: 0 auto;
        padding: 32px 20px 80px;
        position: relative;
        z-index: 1;
      }
      .admin-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--line);
      }
      .admin-head h1 { font-size: 36px; font-weight: 400; margin-top: 4px; }
      .admin-nav { display: flex; gap: 12px; }
      .admin-nav a {
        padding: 9px 16px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        text-decoration: none;
        font-size: 13px;
        color: var(--ink);
        transition: all 0.15s;
      }
      .admin-nav a:hover { background: var(--blue); color: white; border-color: var(--blue); }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 28px;
      }
      .stat {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 18px 16px;
      }
      .stat-val { font-family: var(--display); font-size: 36px; font-weight: 500; line-height: 1; color: var(--ink); }
      .stat-lbl { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
      .stat-blue .stat-val { color: var(--blue); }
      .stat-muted .stat-val { color: var(--muted); }
      .stat-big {
        background: var(--ink);
        color: white;
        border-color: var(--ink);
      }
      .stat-big .stat-val { color: white; font-size: 42px; }
      .stat-big .stat-lbl { color: rgba(255,255,255,0.7); }

      .controls {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .controls input[type="search"] {
        flex: 1;
        min-width: 200px;
        padding: 11px 16px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        font-size: 14px;
        outline: none;
      }
      .controls input[type="search"]:focus { border-color: var(--blue); }
      .filter-tabs {
        display: flex;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 3px;
      }
      .filter-tabs button {
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 6px;
        color: var(--muted);
        transition: all 0.15s;
      }
      .filter-tabs button.active { background: var(--ink); color: white; }

      .list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 14px;
      }
      .card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 18px;
        transition: box-shadow 0.2s, transform 0.1s;
      }
      .card:hover { box-shadow: var(--shadow); }
      .card.status-accepted { border-left: 3px solid var(--blue); }
      .card.status-declined { border-left: 3px solid var(--muted); opacity: 0.85; }
      .card.status-pending  { border-left: 3px solid var(--cream-2); }

      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }
      .card h3 { font-size: 16px; font-weight: 600; margin-bottom: 2px; }
      .card-sub { font-size: 12px; color: var(--muted); }

      .pill {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 500;
        white-space: nowrap;
      }
      .pill.accepted { background: rgba(45, 122, 79, 0.1); color: var(--success); }
      .pill.declined { background: var(--cream-2); color: var(--muted); }
      .pill.pending  { background: rgba(41, 100, 195, 0.08); color: var(--blue); }

      .card-guests {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
        padding: 10px 12px;
        background: var(--cream);
        border-radius: var(--radius-sm);
        align-items: center;
      }
      .card-guests-label { font-size: 12px; color: var(--muted); margin-right: 4px; }
      .guest-chip {
        font-size: 12px;
        padding: 3px 8px;
        background: var(--paper);
        border-radius: 999px;
        border: 1px solid var(--line);
      }

      .card-actions { display: flex; flex-wrap: wrap; gap: 6px; }
      .action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: 12px;
        border-radius: var(--radius-sm);
        background: var(--cream-2);
        color: var(--ink);
        text-decoration: none;
        transition: all 0.15s;
      }
      .action:hover { background: var(--ink); color: white; }
      .action.wa { background: #25D366; color: white; }
      .action.wa:hover { background: #1faa55; }
      .action.ghost { background: transparent; border: 1px solid var(--line); }
    `}</style>
  );
}
