'use client';

import { useRef, useState } from 'react';

type Props = {
  token: string;
  salutation: string;
  fullName: string;
};

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export function UploadClient({ token, salutation, fullName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    let rejected = 0;
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_BYTES) { rejected++; continue; }
      if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) { rejected++; continue; }
      next.push(f);
    }
    if (rejected > 0) {
      setError(`${rejected} dosya atlandı (boyut > ${MAX_FILE_MB}MB veya desteklenmeyen format).`);
    } else {
      setError('');
    }
    setFiles(prev => [...prev, ...next].slice(0, 20));
  };

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const upload = async () => {
    if (files.length === 0) {
      setError('En az bir dosya seçin.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setCurrentFile(f.name);
        const fd = new FormData();
        fd.append('file', f);
        fd.append('token', token);
        if (message) fd.append('message', message);

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? 'Yükleme başarısız');
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu.');
    } finally {
      setUploading(false);
      setCurrentFile('');
    }
  };

  if (done) {
    return (
      <main className="upload-page">
        <div className="container fade-up" style={{ textAlign: 'center' }}>
          <div className="heart" aria-hidden="true">♥</div>
          <p className="eyebrow" style={{ marginBottom: 16 }}>Teşekkürler</p>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, marginBottom: 16 }}>
            Anılarınız bize ulaştı
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
            {salutation}, paylaştığınız her kare bizim için çok değerli.
          </p>
          <button
            className="btn-secondary"
            onClick={() => { setDone(false); setFiles([]); setMessage(''); setProgress(0); }}
          >
            Bir tane daha yükle
          </button>
        </div>
        <UploadStyles />
      </main>
    );
  }

  return (
    <main className="upload-page">
      <div className="container fade-up">
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Düğün Anıları</p>
          <h1 className="serif" style={{ fontSize: 'clamp(36px, 8vw, 52px)', fontWeight: 400, lineHeight: 1.05, marginBottom: 12 }}>
            Merhaba {salutation}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
            Çektiğiniz fotoğraf ve videoları bizimle paylaşır mısınız?
            <br />Tüm anılar Diba ve Kadir'in arşivine eklenir.
          </p>
        </header>

        {/* Dosya seçici */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={e => addFiles(e.target.files)}
          disabled={uploading}
          className="sr-only"
        />

        <button
          type="button"
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <div className="dropzone-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16V4M12 4L7 9M12 4L17 9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 16v2a3 3 0 003 3h12a3 3 0 003-3v-2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <strong>Fotoğraf veya video seç</strong>
            <p>Galeriden veya kameradan, çoklu seçim</p>
          </div>
        </button>

        {/* Dosya listesi */}
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => (
              <li key={i} className={uploading && currentFile === f.name ? 'active' : ''}>
                <FileIcon mime={f.type} />
                <div className="file-meta">
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                {!uploading && (
                  <button onClick={() => remove(i)} className="file-remove" aria-label="Kaldır">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Opsiyonel mesaj */}
        {files.length > 0 && (
          <label className="message-field">
            <span className="eyebrow" style={{ fontSize: 10 }}>Mesaj (opsiyonel)</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Birkaç kelime…"
              rows={2}
              disabled={uploading}
              maxLength={500}
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        {/* Progress bar */}
        {uploading && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span className="progress-text">%{progress} · {currentFile}</span>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={upload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Yükleniyor…' : `Gönder${files.length > 0 ? ` (${files.length})` : ''}`}
        </button>
      </div>
      <UploadStyles />
    </main>
  );
}

function FileIcon({ mime }: { mime: string }) {
  const isVideo = mime.startsWith('video/');
  return (
    <div className="file-icon" data-video={isVideo}>
      {isVideo ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <path d="M17 10l4-2v8l-4-2" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M21 17l-5-5-9 9" />
        </svg>
      )}
    </div>
  );
}

function UploadStyles() {
  return (
    <style jsx global>{`
      .upload-page {
        min-height: 100vh;
        padding: 48px 20px 80px;
        position: relative;
        z-index: 1;
      }
      .upload-page .container { max-width: 540px; margin: 0 auto; }

      .dropzone {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 16px;
        text-align: left;
        padding: 22px 24px;
        background: var(--paper);
        border: 1.5px dashed var(--line);
        border-radius: var(--radius-lg);
        transition: border-color 0.2s, background 0.2s;
      }
      .dropzone:hover:not(:disabled) { border-color: var(--blue); background: var(--cream); }
      .dropzone-icon {
        flex: 0 0 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--light-blue);
        color: var(--blue);
        display: grid;
        place-items: center;
      }
      .dropzone strong { display: block; font-size: 16px; margin-bottom: 2px; }
      .dropzone p { font-size: 13px; color: var(--muted); }

      .file-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }
      .file-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        transition: background 0.2s;
      }
      .file-list li.active {
        background: var(--light-blue);
        border-color: var(--blue);
      }
      .file-icon {
        width: 36px; height: 36px;
        border-radius: var(--radius-sm);
        background: var(--cream-2);
        color: var(--blue);
        display: grid; place-items: center;
        flex-shrink: 0;
      }
      .file-icon[data-video="true"] { background: var(--light-blue); }
      .file-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .file-name {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-size { font-size: 12px; color: var(--muted); }
      .file-remove {
        width: 30px; height: 30px;
        border-radius: 50%;
        color: var(--muted);
        display: grid; place-items: center;
        transition: background 0.15s, color 0.15s;
      }
      .file-remove:hover { background: var(--cream-2); color: var(--error); }

      .message-field {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .message-field textarea {
        padding: 12px 14px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        font-size: 15px;
        outline: none;
        font-family: inherit;
        resize: vertical;
        min-height: 60px;
        transition: border-color 0.2s;
      }
      .message-field textarea:focus { border-color: var(--blue); }

      .progress {
        margin-top: 20px;
        position: relative;
        height: 44px;
        background: var(--paper);
        border-radius: var(--radius);
        border: 1px solid var(--line);
        overflow: hidden;
      }
      .progress-bar {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, var(--light-blue), var(--blue-soft));
        transition: width 0.4s;
      }
      .progress-text {
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: var(--ink);
        font-weight: 500;
        z-index: 1;
        padding: 0 16px;
      }

      .btn-primary {
        width: 100%;
        margin-top: 24px;
        padding: 18px;
        background: var(--blue);
        color: white;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s, transform 0.05s;
      }
      .btn-primary:hover:not(:disabled) { background: var(--blue-soft); }
      .btn-primary:active:not(:disabled) { transform: scale(0.99); }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

      .btn-secondary {
        padding: 14px 28px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 999px;
        font-size: 15px;
        color: var(--ink);
        transition: background 0.2s;
      }
      .btn-secondary:hover { background: var(--cream-2); }

      .heart {
        font-size: 48px;
        color: var(--blue);
        margin-bottom: 16px;
        animation: heartBeat 1.4s ease-in-out;
      }
      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        20% { transform: scale(1.25); }
        40% { transform: scale(1); }
        60% { transform: scale(1.18); }
      }
    `}</style>
  );
}
