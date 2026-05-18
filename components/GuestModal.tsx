'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (guests: string[]) => Promise<void> | void;
  salutation: string;
};

export function GuestModal({ open, onClose, onSubmit, salutation }: Props) {
  const [names, setNames] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNames(['']);
      setSubmitting(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const update = (i: number, v: string) => setNames(prev => prev.map((n, idx) => idx === i ? v : n));
  const add = () => setNames(prev => [...prev, '']);
  const remove = (i: number) => setNames(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const cleaned = names.map(n => n.trim()).filter(Boolean);
    try {
      await onSubmit(cleaned);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop fade"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
    >
      <div className="modal-card">
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Harika!</p>
          <h2 id="guest-modal-title" className="serif" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.2, marginBottom: 8 }}>
            Yanınızda kim gelecek?
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Eşiniz, çocuklarınız ya da yanınızda gelecek diğer kişilerin isimleri.
            <br />
            <span style={{ fontStyle: 'italic' }}>Yalnız geleceksiniz, boş bırakabilirsiniz.</span>
          </p>
        </header>

        <div className="name-list">
          {names.map((name, i) => (
            <div key={i} className="name-row">
              <input
                ref={i === 0 ? firstInputRef : undefined}
                type="text"
                value={name}
                onChange={(e) => update(i, e.target.value)}
                placeholder="Ad Soyad"
                disabled={submitting}
                maxLength={120}
                aria-label={`Kişi ${i + 1}`}
              />
              {names.length > 1 && (
                <button
                  type="button"
                  className="name-remove"
                  onClick={() => remove(i)}
                  disabled={submitting}
                  aria-label="Bu kişiyi kaldır"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="name-add"
          onClick={add}
          disabled={submitting || names.length >= 10}
        >
          + Bir kişi daha
        </button>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Geri
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Onayla ve Gönder'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(15, 30, 58, 0.4);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: var(--paper);
          border-radius: var(--radius-lg);
          padding: 36px 28px 28px;
          max-width: 460px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          animation: modalIn 0.3s cubic-bezier(.2,.8,.2,1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .name-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .name-row { position: relative; display: flex; align-items: center; }
        .name-row input {
          flex: 1;
          padding: 13px 44px 13px 16px;
          background: var(--cream);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .name-row input:focus { border-color: var(--blue); background: var(--paper); }
        .name-remove {
          position: absolute; right: 8px;
          width: 32px; height: 32px;
          display: grid; place-items: center;
          border-radius: 50%;
          color: var(--muted);
          transition: background 0.15s, color 0.15s;
        }
        .name-remove:hover:not(:disabled) { background: var(--cream-2); color: var(--error); }
        .name-add {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px dashed var(--line);
          border-radius: var(--radius);
          color: var(--blue);
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          transition: background 0.15s, border-color 0.15s;
        }
        .name-add:hover:not(:disabled) { background: var(--light-blue); border-color: var(--blue); }
        .name-add:disabled { opacity: 0.5; cursor: not-allowed; }

        .modal-actions { display: flex; gap: 10px; }
        .btn-ghost, .btn-primary {
          flex: 1;
          padding: 14px 20px;
          border-radius: var(--radius);
          font-size: 15px;
          font-weight: 500;
          transition: opacity 0.15s, transform 0.05s;
        }
        .btn-ghost {
          background: var(--cream-2);
          color: var(--ink);
        }
        .btn-ghost:hover:not(:disabled) { background: var(--line); }
        .btn-primary {
          background: var(--blue);
          color: white;
        }
        .btn-primary:hover:not(:disabled) { background: var(--blue-soft); }
        .btn-primary:active:not(:disabled), .btn-ghost:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary:disabled, .btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
