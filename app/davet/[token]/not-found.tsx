export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>Davetiye Bulunamadı</p>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 16 }}>
          Geçersiz bağlantı
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Davetiyenizdeki bağlantı hatalı olabilir. Lütfen tekrar kontrol edin
          veya davetiyeyi gönderen kişiyle iletişime geçin.
        </p>
      </div>
    </main>
  );
}
