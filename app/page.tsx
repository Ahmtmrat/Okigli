'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import IntroAnimation from './intro-animation';

type PickedFile = {
  id: string;
  file: File;
  url: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(file: File) {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(file.name);
}

function InvitationSectionCard({ onRsvp }: { onRsvp: (message: string) => void }) {
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);

  const choose = (next: 'yes' | 'no') => {
    const value = choice === next ? null : next;
    setChoice(value);
    onRsvp(
      value
        ? 'Katılım bildirimi için davetinizdeki kişisel bağlantınızı kullanın.'
        : 'Seçim temizlendi.'
    );
  };

  return (
    <div className="invite-card-stage">
      <div className="invite-card">
        <section className="invite-card-top">
          <h1 className="invite-names">
            <span>D</span>iba <span className="amp">&amp;</span> <span>K</span>adir
          </h1>

          <div className="invite-rsvp-wrap">
            <div className="invite-rsvp" role="group" aria-label="Katılım durumu" data-chosen={choice ?? undefined}>
              <button className="invite-btn" type="button" aria-pressed={choice === 'yes'} onClick={() => choose('yes')}>
                <svg className="mark" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                  <path d="M2 7.5 L6 11 L12 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Katılacağım
              </button>
              <button className="invite-btn" type="button" aria-pressed={choice === 'no'} onClick={() => choose('no')}>
                <svg className="mark" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                  <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Katılmayacağım
              </button>
            </div>
            <div className="rsvp-thanks">
              {choice === 'yes' ? 'Sizi aramızda görmek bizi çok mutlu edecek' : 'Yanıtınız için teşekkür ederiz'}
            </div>
          </div>
        </section>

        <section className="invite-card-bottom">
          <div className="invite-col left">
            <div className="line">Yıldırım ve<br />Doğan Aileleri</div>
          </div>
          <div className="invite-col center">
            <div className="line">Cumartesi,</div>
            <div className="line">18 Temmuz</div>
            <div className="line">18:30</div>
          </div>
          <div className="invite-col right">
            <div className="line">Prof. Dr. Erdal İnönü Kent Parkı</div>
            <div className="line">Lara Cd.</div>
            <div className="line">Antalya</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [animDone, setAnimDone] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const dragDepth = useRef(0);
  const filesRef = useRef<PickedFile[]>([]);

  // Scroll lock: animasyon bitene kadar aşağı kaydırmayı engelle
  useEffect(() => {
    document.body.style.overflow = animDone ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [animDone]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;

    const incoming = Array.from(list);
    const accepted = incoming.filter(isImage);
    const rejected = incoming.length - accepted.length;

    if (accepted.length === 0) {
      if (rejected > 0) showToast('Sadece görsel dosyaları kabul edilir.');
      return;
    }

    const next = accepted.map(file => ({
      id: `${Date.now()}-${crypto.randomUUID()}`,
      file,
      url: URL.createObjectURL(file),
    }));

    setFiles(prev => [...prev, ...next]);
    showToast(`${accepted.length} fotoğraf seçildi. Yüklemek için kişisel bağlantınızı kullanın.`);
    if (rejected > 0) {
      setTimeout(() => showToast(`${rejected} dosya desteklenmiyor.`), 2700);
    }
  }, [showToast]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const found = prev.find(item => item.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter(item => item.id !== id);
    });
  };

  const clearFiles = () => {
    setFiles(prev => {
      prev.forEach(item => URL.revokeObjectURL(item.url));
      return [];
    });
    showToast('Galeri temizlendi.');
  };

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      clearTimeout(toastTimer.current);
      filesRef.current.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  return (
    <>
      <main className="home-shell">
        <section className="hero" aria-label="Diba ve Kadir düğün davetiyesi">
          <IntroAnimation embedded showSkip={false} onComplete={() => setAnimDone(true)} />
          {animDone && (
            <a className="scroll-cue" href="#invitation" aria-label="Davetiyeye git">
              <span>Davetiye</span>
            </a>
          )}
        </section>

        <section className="invite-section" id="invitation">
          <div className="invite-frame">
            <InvitationSectionCard onRsvp={showToast} />
          </div>
        </section>

        <section className="photo-section" id="photos">
          <div className="photo-frame">
            <div className="photo-page">
              <div className="photo-eyebrow">Anılarınızı Paylaşın</div>
              <p className="photo-lede">
                Bizimle özel anlarınızı paylaşın.
                <br />
                Fotoğraflarınızı aşağıya sürükleyin ya da tıklayarak seçin.
              </p>

              <label
                className={`dropzone${dragging ? ' is-drag' : ''}`}
                tabIndex={0}
                aria-label="Fotoğraf yükleme alanı"
                onDragEnter={event => {
                  event.preventDefault();
                  dragDepth.current += 1;
                  setDragging(true);
                }}
                onDragOver={event => event.preventDefault()}
                onDragLeave={event => {
                  event.preventDefault();
                  dragDepth.current = Math.max(0, dragDepth.current - 1);
                  if (dragDepth.current === 0) setDragging(false);
                }}
                onDrop={event => {
                  event.preventDefault();
                  dragDepth.current = 0;
                  setDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
              >
                <span className="upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4" />
                    <path d="M7 9l5-5 5 5" />
                    <path d="M5 20h14" />
                  </svg>
                </span>
                <span className="dz-text">
                  <span className="dz-primary">Fotoğraf seçmek için tıklayın veya sürükleyin</span>
                  <span className="dz-meta">
                    <span>JPG</span><span className="dot" />
                    <span>PNG</span><span className="dot" />
                    <span>HEIC</span><span className="dot" />
                    <span>Çoklu seçim desteklenir</span>
                  </span>
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                  multiple
                  onChange={event => {
                    addFiles(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
              </label>

              {files.length > 0 && (
                <section className="gallery-wrap" aria-live="polite">
                  <header className="gallery-head">
                    <div className="gallery-title">
                      Yüklenenler <span className="count">{files.length} fotoğraf</span>
                    </div>
                    <button className="gallery-clear" type="button" onClick={clearFiles}>Tümünü Temizle</button>
                  </header>
                  <div className="grid">
                    {files.map((item, index) => (
                      <div className="memory-card" key={item.id} style={{ animationDelay: `${index * 40}ms` }}>
                        <img src={item.url} alt={item.file.name} />
                        <div className="card-overlay">
                          <div className="card-name">{item.file.name}</div>
                          <div className="card-size">{formatSize(item.file.size)}</div>
                        </div>
                        <button className="card-remove" type="button" aria-label="Kaldır" onClick={() => removeFile(item.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>Diba &amp; Kadir</span>
            <span>18 Temmuz 2026</span>
            <span>Antalya</span>
          </div>
        </footer>
      </main>

      <div className={`home-toast${toast ? ' show' : ''}`}>
        <span className="toast-dot" />
        <span>{toast}</span>
      </div>

      <style jsx global>{`
        :root {
          --home-bg: #efead6;
          --home-bg-2: #e3dac1;
          --home-ink: #2a1f14;
          --home-ink-soft: #4d3f2e;
          --home-ink-mute: #7a6a55;
          --home-ink-dim: #a89779;
          --home-accent: #5a78c4;
          --home-accent-soft: #8aa0d4;
          --home-border: rgba(42, 31, 20, 0.22);
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--home-bg);
          overflow-x: hidden;
        }

        .home-shell {
          min-height: 100vh;
          background: var(--home-bg);
          color: var(--home-ink);
          transition: opacity 0.8s ease;
        }

        .hero {
          position: relative;
          width: 100%;
          height: 100dvh;
          min-height: 560px;
          overflow: hidden;
          background: #73859b;
        }

        .scroll-cue {
          position: absolute;
          bottom: clamp(20px, 4vh, 40px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.85);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(11px, 1.2vw, 13px);
          letter-spacing: 0.42em;
          text-transform: uppercase;
          text-decoration: none;
          z-index: 5;
          opacity: 0;
          animation: cueFade 1.2s ease-out 0.4s forwards;
        }

        .scroll-cue::after {
          content: '';
          width: 1px;
          height: 36px;
          background: rgba(255, 255, 255, 0.6);
          animation: cueDrop 1.9s cubic-bezier(.6, .04, .4, 1) infinite;
          transform-origin: top center;
        }

        @keyframes cueFade {
          from { opacity: 0; transform: translate(-50%, 6px); }
          to { opacity: 0.85; transform: translate(-50%, 0); }
        }

        @keyframes cueDrop {
          0% { transform: scaleY(0); transform-origin: top; }
          45% { transform: scaleY(1); transform-origin: top; }
          55% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        .invite-section,
        .photo-section {
          width: 100%;
          background: var(--home-bg);
          padding: 7px;
        }

        .invite-frame,
        .photo-frame {
          width: 100%;
          max-width: 1664px;
          margin: 0 auto;
          border: 1.5px solid var(--home-accent);
          background: var(--home-bg);
        }

        .invite-frame {
          min-height: calc(100dvh - 14px);
          display: grid;
          place-items: center;
          padding: 10px;
        }

        .invite-card-stage {
          width: min(100%, 1664px);
          aspect-ratio: 1664 / 936;
          position: relative;
        }

        .invite-card {
          position: absolute;
          inset: 0;
          background: var(--home-bg);
          display: grid;
          grid-template-rows: 1fr 1fr;
          padding: 60px 80px;
          font-family: 'Forum', 'Cormorant Garamond', serif;
          color: #1a1410;
        }

        .invite-card-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
        }

        .invite-names {
          font-family: 'Pinyon Script', cursive;
          font-size: clamp(72px, 12vw, 200px);
          line-height: 0.95;
          letter-spacing: 0.005em;
          color: #1a1410;
          white-space: nowrap;
          font-weight: 400;
        }

        .invite-names .amp {
          font-size: 0.85em;
        }

        .invite-rsvp-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .invite-rsvp {
          display: flex;
          gap: 28px;
          align-items: center;
        }

        .invite-btn {
          font-family: 'Forum', serif;
          font-size: 18px;
          letter-spacing: 0.22em;
          color: var(--home-accent);
          background: #c9d3ee;
          border: 1px solid transparent;
          padding: 18px 46px;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.25s ease, color 0.25s ease, transform 0.15s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          position: relative;
          user-select: none;
        }

        .invite-btn:hover {
          background: #b9c6e8;
          transform: translateY(-1px);
        }

        .invite-btn:active {
          transform: translateY(0);
        }

        .invite-btn[aria-pressed="true"] {
          background: var(--home-accent);
          color: var(--home-bg);
          box-shadow: 0 6px 18px -8px rgba(58, 90, 168, 0.55);
          border-color: #3a5aa8;
        }

        .invite-btn .mark {
          display: inline-block;
          width: 0;
          overflow: hidden;
          transition: width 0.25s ease, margin 0.25s ease;
          vertical-align: middle;
        }

        .invite-btn[aria-pressed="true"] .mark {
          width: 14px;
          margin-right: 10px;
        }

        .rsvp-thanks {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -34px;
          font-size: 14px;
          letter-spacing: 0.28em;
          color: var(--home-accent);
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          white-space: nowrap;
        }

        .invite-rsvp[data-chosen] + .rsvp-thanks {
          opacity: 1;
        }

        .invite-card-bottom {
          display: grid;
          grid-template-columns: 1fr 1.1fr 1fr;
          align-items: center;
          gap: 60px;
          padding-top: 30px;
        }

        .invite-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
          text-align: center;
        }

        .invite-col .line {
          font-size: 30px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1.35;
        }

        .invite-col.center .line {
          font-size: 46px;
        }

        .invite-col.center .line + .line,
        .invite-col.right .line + .line {
          border-top: 1px solid var(--home-accent);
        }

        .invite-col.center .line + .line {
          padding-top: 22px;
        }

        .invite-col.right .line {
          font-size: 22px;
        }

        .invite-col.right .line + .line {
          padding-top: 18px;
        }

        .invite-col.left .line {
          font-size: 30px;
          line-height: 1.5;
        }

        .photo-frame {
          padding: 84px 32px;
        }

        .photo-page {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .photo-eyebrow {
          font-family: 'Cormorant Garamond', 'Times New Roman', serif;
          font-size: clamp(28px, 4.4vw, 56px);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--home-ink);
          font-weight: 400;
          line-height: 1.1;
          margin-bottom: 36px;
        }

        .photo-lede {
          color: var(--home-ink-mute);
          font-size: 15px;
          line-height: 1.7;
          max-width: 520px;
          margin: 0 0 56px;
          font-weight: 300;
        }

        .dropzone {
          width: 100%;
          max-width: 720px;
          border: 1.5px dashed var(--home-border);
          border-radius: 4px;
          padding: 72px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          cursor: pointer;
          transition: border-color 240ms ease, background 240ms ease, transform 240ms ease;
        }

        .dropzone:hover,
        .dropzone:focus-visible {
          border-color: rgba(90, 120, 196, 0.55);
          background: rgba(90, 120, 196, 0.04);
          outline: none;
        }

        .dropzone.is-drag {
          border-color: var(--home-accent);
          background: rgba(90, 120, 196, 0.08);
          transform: translateY(-2px);
        }

        .upload-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 1px solid var(--home-border);
          color: var(--home-ink-soft);
          display: grid;
          place-items: center;
          transition: border-color 240ms ease, color 240ms ease, transform 240ms ease;
        }

        .upload-icon svg {
          width: 22px;
          height: 22px;
        }

        .dropzone:hover .upload-icon,
        .dropzone.is-drag .upload-icon {
          border-color: var(--home-accent-soft);
          color: var(--home-accent-soft);
          transform: translateY(-4px);
        }

        .dz-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .dz-primary {
          font-size: 15px;
          color: var(--home-accent);
          letter-spacing: 0.04em;
          font-weight: 400;
        }

        .dz-meta {
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--home-ink-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          font-weight: 400;
          flex-wrap: wrap;
        }

        .dz-meta .dot,
        .toast-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.7;
        }

        .dropzone input[type="file"] {
          display: none;
        }

        .gallery-wrap {
          width: 100%;
          max-width: 980px;
          margin-top: 56px;
        }

        .gallery-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 24px;
          padding: 0 4px 20px;
          border-bottom: 1px solid rgba(42, 31, 20, 0.12);
          margin-bottom: 24px;
        }

        .gallery-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-style: italic;
          color: var(--home-ink);
          font-weight: 400;
        }

        .gallery-title .count {
          color: var(--home-ink-mute);
          font-style: normal;
          font-family: 'Inter', 'Manrope', sans-serif;
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-left: 12px;
        }

        .gallery-clear {
          color: var(--home-ink-mute);
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px 0;
          transition: color 200ms ease;
        }

        .gallery-clear:hover {
          color: #b85a4a;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        .memory-card {
          position: relative;
          aspect-ratio: 4 / 5;
          background: var(--home-bg-2);
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(42, 31, 20, 0.10);
          animation: photoFadeUp 480ms cubic-bezier(.2, .7, .2, 1) both;
        }

        @keyframes photoFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .memory-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 500ms cubic-bezier(.2, .7, .2, 1);
        }

        .memory-card:hover img {
          transform: scale(1.04);
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(20, 24, 30, 0.85) 0%, rgba(20, 24, 30, 0) 45%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px 16px;
          opacity: 0;
          transition: opacity 240ms ease;
        }

        .memory-card:hover .card-overlay {
          opacity: 1;
        }

        .card-name {
          font-size: 12px;
          color: #fbf4e3;
          font-weight: 400;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-size {
          font-size: 10px;
          color: rgba(251, 244, 227, 0.75);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .card-remove {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(20, 24, 30, 0.7);
          border: 1px solid rgba(251, 244, 227, 0.18);
          color: #fbf4e3;
          display: grid;
          place-items: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 200ms ease, background 200ms ease;
        }

        .memory-card:hover .card-remove {
          opacity: 1;
        }

        .card-remove:hover {
          background: #b85a4a;
        }

        .card-remove svg {
          width: 12px;
          height: 12px;
        }

        .site-footer {
          width: 100%;
          padding: 32px 14px;
          background: var(--home-bg);
        }

        .site-footer-inner {
          max-width: 1664px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          gap: 32px;
          font-family: 'Cormorant Garamond', 'Times New Roman', serif;
          font-size: clamp(14px, 1.5vw, 20px);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--home-ink);
          text-align: center;
        }

        .site-footer-inner span {
          flex: 1;
          min-width: 0;
        }

        .home-toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(20, 24, 30, 0.92);
          color: #fbf4e3;
          border: 1px solid rgba(251, 244, 227, 0.14);
          padding: 12px 22px;
          border-radius: 4px;
          font-size: 13px;
          letter-spacing: 0.04em;
          opacity: 0;
          transition: opacity 240ms ease, transform 240ms ease;
          pointer-events: none;
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: min(520px, calc(100vw - 28px));
          text-align: center;
        }

        .home-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @media (max-height: 560px) {
          .scroll-cue { display: none; }
        }

        @media (max-width: 900px) {
          .hero {
            min-height: 480px;
          }

          .invite-frame {
            min-height: auto;
          }

          .invite-card-stage {
            aspect-ratio: auto;
          }

          .invite-card {
            position: relative;
            inset: auto;
            padding: 40px 26px;
            display: flex;
            flex-direction: column;
            gap: 28px;
            min-height: calc(100dvh - 16px);
          }

          .invite-card-top {
            gap: 22px;
          }

          .invite-names {
            font-size: clamp(56px, 18vw, 120px);
            white-space: normal;
            text-align: center;
            line-height: 1;
          }

          .invite-rsvp {
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }

          .invite-btn {
            padding: 14px 28px;
            font-size: 13px;
            letter-spacing: 0.18em;
            width: 100%;
            max-width: 320px;
          }

          .rsvp-thanks {
            font-size: 11px;
            bottom: -28px;
          }

          .invite-card-bottom {
            grid-template-columns: 1fr;
            gap: 26px;
            padding-top: 4px;
          }

          .invite-col {
            gap: 14px;
          }

          .invite-col .line {
            font-size: 18px;
            letter-spacing: 0.14em;
          }

          .invite-col.center .line {
            font-size: 24px;
          }

          .invite-col.right .line {
            font-size: 16px;
          }

          .invite-col.left .line {
            font-size: 18px;
          }

          .invite-col.center .line + .line,
          .invite-col.right .line + .line {
            padding-top: 14px;
          }

          .photo-frame {
            padding: 56px 20px;
          }

          .photo-eyebrow {
            font-size: 24px;
            letter-spacing: 0.22em;
            margin-bottom: 24px;
          }

          .photo-lede {
            margin-bottom: 40px;
          }

          .dropzone {
            padding: 52px 24px;
          }

          .dz-meta {
            gap: 10px;
            font-size: 10px;
            letter-spacing: 0.22em;
          }

          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 640px) {
          .site-footer {
            padding: 24px 14px;
          }

          .site-footer-inner {
            flex-direction: column;
            gap: 10px;
            letter-spacing: 0.22em;
            font-size: 13px;
          }

          .site-footer-inner span {
            flex: initial;
          }

          .gallery-head {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
}
