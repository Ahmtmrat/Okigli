'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Memory = {
  id: number;
  invitee_token: string | null;
  uploader_name: string;
  drive_file_id: string;
  drive_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export default function GalleryPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40, color: 'var(--muted)' }}>Yükleniyor…</main>}>
      <GalleryContent />
    </Suspense>
  );
}

function GalleryContent() {
  const params = useSearchParams();
  const key = params.get('key') ?? '';
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!key) { setErr('?key= parametresi gerekli'); setLoading(false); return; }
    fetch(`/api/admin/gallery?key=${encodeURIComponent(key)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setItems(d.items))
      .catch(() => setErr('Yetkisiz veya hata'))
      .finally(() => setLoading(false));
  }, [key]);

  if (loading) return <main style={{ padding: 40, color: 'var(--muted)' }}>Yükleniyor…</main>;
  if (err) return <main style={{ padding: 40, color: 'var(--error)' }}>{err}</main>;

  // Yükleyene göre grupla
  const groups: Record<string, Memory[]> = {};
  for (const m of items) (groups[m.uploader_name] ??= []).push(m);

  return (
    <main className="gallery-page">
      <header className="gallery-head">
        <div>
          <p className="eyebrow">Düğün Anıları</p>
          <h1 className="serif">Galeri</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {items.length} dosya · {Object.keys(groups).length} kişiden
          </p>
        </div>
        <a href={`/admin?key=${encodeURIComponent(key)}`} className="back">← Davetli Listesi</a>
      </header>

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>
          Henüz yüklenen bir anı yok.
        </p>
      ) : (
        Object.entries(groups).map(([uploader, list]) => (
          <section key={uploader} className="group">
            <h2>{uploader} <span>({list.length})</span></h2>
            <div className="grid">
              {list.map(m => <Card key={m.id} m={m} />)}
            </div>
          </section>
        ))
      )}

      <Styles />
    </main>
  );
}

function Card({ m }: { m: Memory }) {
  const isVideo = m.file_type.startsWith('video/');
  return (
    <a href={m.drive_url} target="_blank" rel="noopener" className="mem">
      <div className="thumb">
        {isVideo ? (
          <div className="vid-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        ) : (
          <img src={`https://drive.google.com/thumbnail?id=${m.drive_file_id}&sz=w400`} alt="" loading="lazy" />
        )}
      </div>
      <div className="mem-meta">
        <span className="mem-name">{m.file_name}</span>
        <span className="mem-info">{(m.file_size / 1024 / 1024).toFixed(1)} MB · {new Date(m.created_at).toLocaleString('tr-TR')}</span>
      </div>
    </a>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .gallery-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 80px;
        position: relative;
        z-index: 1;
      }
      .gallery-head {
        display: flex; justify-content: space-between; align-items: flex-end;
        flex-wrap: wrap; gap: 16px;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--line);
      }
      .gallery-head h1 { font-size: 36px; font-weight: 400; margin: 4px 0 6px; }
      .back {
        padding: 8px 14px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        text-decoration: none;
        font-size: 13px;
        color: var(--ink);
      }

      .group { margin-bottom: 36px; }
      .group h2 {
        font-family: var(--display);
        font-size: 22px;
        font-weight: 500;
        margin-bottom: 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--line);
      }
      .group h2 span { color: var(--muted); font-size: 14px; font-weight: 400; }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
      .mem {
        display: block;
        text-decoration: none;
        color: inherit;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .mem:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
      .thumb {
        aspect-ratio: 1;
        background: var(--cream-2);
        position: relative;
        overflow: hidden;
      }
      .thumb img { width: 100%; height: 100%; object-fit: cover; }
      .vid-icon {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        background: linear-gradient(135deg, var(--blue), var(--blue-soft));
        color: white;
      }
      .mem-meta { padding: 10px 12px; }
      .mem-name {
        display: block;
        font-size: 12px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mem-info { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }
    `}</style>
  );
}
