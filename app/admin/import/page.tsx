'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ImportPage() {
  const params = useSearchParams();
  const key = params.get('key') ?? '';
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<{ ok: boolean; inserted?: number; errors?: string[]; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!csv.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/import?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csv,
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? 'Hata' });
      } else {
        setResult({ ok: true, inserted: data.inserted, errors: data.errors });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  };

  return (
    <main className="import-page">
      <header>
        <p className="eyebrow">Davetli Yönetimi</p>
        <h1 className="serif">CSV ile Toplu Ekleme</h1>
        <a href={`/admin?key=${encodeURIComponent(key)}`} className="back">← Geri</a>
      </header>

      <section className="info">
        <h2>CSV Formatı</h2>
        <p>Birinci satır başlık. Sütunlar: <code>full_name</code>, <code>salutation</code>, <code>phone</code> (opsiyonel).</p>
        <pre>{`full_name,salutation,phone
Ahmet Yılmaz,Ahmet Bey,905321234567
Ayşe Demir,Ayşe Hanım,905339876543
Mehmet Kara,Mehmet Bey,`}</pre>
        <ul>
          <li><strong>Telefon</strong>: ülke kodu ile (905…), boşluksuz, eksiyse boş bırak.</li>
          <li><strong>Aynı isimde mükerrer</strong>: tekrar eklenmez (full_name + phone unique kontrol).</li>
          <li>Her satır için <strong>otomatik 8 karakterli token</strong> üretilir.</li>
        </ul>
      </section>

      <section className="actions">
        <label className="file-input">
          <input type="file" accept=".csv,text/csv" onChange={e => onFile(e.target.files?.[0])} style={{ display: 'none' }} />
          <span>📄 CSV Dosyası Seç</span>
        </label>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>veya aşağıya yapıştır</span>
      </section>

      <textarea
        value={csv}
        onChange={e => setCsv(e.target.value)}
        rows={14}
        placeholder="CSV içeriği..."
        spellCheck={false}
      />

      <button className="submit" onClick={submit} disabled={submitting || !csv.trim()}>
        {submitting ? 'Ekleniyor…' : 'Davetlileri Ekle'}
      </button>

      {result && (
        <div className={`result ${result.ok ? 'ok' : 'err'}`}>
          {result.ok ? (
            <>
              <strong>✓ {result.inserted} davetli eklendi.</strong>
              {result.errors && result.errors.length > 0 && (
                <details>
                  <summary>{result.errors.length} satır atlandı</summary>
                  <ul>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </details>
              )}
            </>
          ) : (
            <strong>✗ {result.message}</strong>
          )}
        </div>
      )}

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .import-page {
        max-width: 760px;
        margin: 0 auto;
        padding: 32px 20px 80px;
        position: relative;
        z-index: 1;
      }
      .import-page header { margin-bottom: 28px; position: relative; }
      .import-page h1 { font-size: 36px; font-weight: 400; margin-top: 4px; }
      .back {
        position: absolute; top: 8px; right: 0;
        padding: 8px 14px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        text-decoration: none;
        font-size: 13px;
        color: var(--ink);
      }
      .info {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 20px 24px;
        margin-bottom: 24px;
      }
      .info h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
      .info p, .info ul { font-size: 14px; color: var(--ink); }
      .info ul { margin-top: 12px; padding-left: 20px; }
      .info li { margin: 4px 0; color: var(--muted); }
      .info code { background: var(--cream-2); padding: 1px 6px; border-radius: 4px; font-family: var(--mono); font-size: 13px; }
      .info pre {
        background: var(--cream);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 12px 14px;
        font-family: var(--mono);
        font-size: 12px;
        overflow-x: auto;
        margin: 12px 0 4px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }
      .file-input span {
        display: inline-block;
        padding: 10px 16px;
        background: var(--ink);
        color: white;
        border-radius: var(--radius-sm);
        font-size: 14px;
        cursor: pointer;
      }
      .import-page textarea {
        width: 100%;
        padding: 14px 16px;
        font-family: var(--mono);
        font-size: 13px;
        line-height: 1.5;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        outline: none;
        resize: vertical;
      }
      .import-page textarea:focus { border-color: var(--blue); }
      .submit {
        margin-top: 16px;
        padding: 14px 28px;
        background: var(--blue);
        color: white;
        border-radius: var(--radius-sm);
        font-size: 15px;
        font-weight: 500;
      }
      .submit:disabled { opacity: 0.5; cursor: not-allowed; }

      .result {
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: var(--radius-sm);
        font-size: 14px;
      }
      .result.ok { background: rgba(45, 122, 79, 0.08); color: var(--success); }
      .result.err { background: rgba(179, 64, 54, 0.08); color: var(--error); }
      .result details { margin-top: 8px; font-size: 13px; }
      .result summary { cursor: pointer; color: var(--muted); }
      .result ul { margin-top: 6px; padding-left: 20px; }
    `}</style>
  );
}
