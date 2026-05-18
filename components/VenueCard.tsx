'use client';

import { VENUE, getDirectionsUrl } from '@/lib/venue';

export function VenueCard() {
  return (
    <aside style={{
      marginTop: 48,
      padding: '28px 24px',
      background: 'var(--paper)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
      }}>
        <PinIcon />
        <span className="eyebrow">Düğün Yeri</span>
      </div>

      <h2 className="serif" style={{
        fontSize: 22,
        fontWeight: 500,
        marginBottom: 6,
        lineHeight: 1.25,
      }}>
        {VENUE.name}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
        {VENUE.address}
      </p>

      <a
        href={getDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'background 0.2s',
        }}
      >
        Yol tarifi al
        <ArrowIcon />
      </a>
    </aside>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--blue)' }}>
      <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
