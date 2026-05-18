export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p className="eyebrow" style={{ marginBottom: 24 }}>18 Temmuz 2026 · Antalya</p>
        <h1 className="serif" style={{
          fontSize: 'clamp(56px, 12vw, 96px)',
          lineHeight: 1,
          fontWeight: 300,
          letterSpacing: '-0.02em',
        }}>
          Diba <em style={{ color: 'var(--blue)', fontWeight: 400 }}>&</em> Kadir
        </h1>
        <p style={{ marginTop: 32, color: 'var(--muted)' }}>
          Davetiyenizdeki bağlantı üzerinden erişebilirsiniz.
        </p>
      </div>
    </main>
  );
}
