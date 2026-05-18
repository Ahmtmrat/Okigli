'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOutCubic   = (t: number) => { const u = t - 1; return u * u * u + 1; };
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Stage dimensions (portrait)
const SW = 1080, SH = 1920;
const COMPLETE_AT = 9.5;

// Dusty Blue palette (from Davetiye.html)
const C = {
  bgTop:    '#8a9db5',
  bgBottom: '#4a5d78',
  goldLight: '#d9b87a',
  gold:     '#b08648',
  goldDeep: '#856338',
  env:      '#8492a8',
  envShadow: '#6b7a91',
  envFlap:  '#97a4b8',
  liningTop: '#fbf4e3',
  liningBottom: '#e8dcc0',
  wax:      '#8a3a2a',
  waxDark:  '#5e2418',
};

// ── Gold Dust ─────────────────────────────────────────────────────────────────
type Particle = {
  x: number; y0: number; size: number; speed: number;
  swayAmp: number; swayFreq: number; phase: number; opacity: number; blur: boolean;
};
function makeParticles(count: number): Particle[] {
  let s = 13.37;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: count }, () => ({
    x: rnd() * SW, y0: rnd() * (SH + 400),
    size: 1.5 + rnd() * 4, speed: 10 + rnd() * 22,
    swayAmp: 12 + rnd() * 50, swayFreq: 0.25 + rnd() * 0.7,
    phase: rnd() * Math.PI * 2, opacity: 0.25 + rnd() * 0.45,
    blur: rnd() > 0.65,
  }));
}
function GoldDust({ t, particles }: { t: number; particles: Particle[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => {
        const y = ((p.y0 + t * p.speed) % (SH + 200)) - 100;
        const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: p.size, height: p.size,
            background: C.goldLight, borderRadius: '50%',
            opacity: p.opacity,
            boxShadow: `0 0 ${p.blur ? 8 : 3}px ${C.gold}`,
            filter: p.blur ? 'blur(1px)' : 'none',
          }} />
        );
      })}
    </div>
  );
}

// ── Backdrop ──────────────────────────────────────────────────────────────────
function Backdrop({ t }: { t: number }) {
  const scale = 1 + t * 0.003;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      transform: `scale(${scale})`, transformOrigin: 'center',
      background: `radial-gradient(ellipse 90% 60% at 50% 35%, ${C.bgTop} 0%, #6a7d95 60%, ${C.bgBottom} 130%)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 25%, rgba(255,255,255,0.15), transparent 45%),
          radial-gradient(circle at 78% 75%, rgba(0,0,0,0.10), transparent 55%),
          radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.18) 110%)
        `,
      }} />
    </div>
  );
}

// ── Wax Seal ──────────────────────────────────────────────────────────────────
function SealHalf({ side }: { side: 'left' | 'right' }) {
  const off = side === 'right' ? -65 : 0;
  const gid = `wg${side}`;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130"
      style={{ position: 'absolute', left: off, top: 0 }}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#c25a48" />
          <stop offset="55%" stopColor={C.wax} />
          <stop offset="100%" stopColor={C.waxDark} />
        </radialGradient>
      </defs>
      <ellipse cx="65" cy="72" rx="56" ry="56" fill="rgba(0,0,0,0.30)" />
      <path d="M65 12C90 10,116 22,118 50C122 75,115 102,90 116C70 124,45 122,28 108C10 92,8 65,18 42C28 22,48 13,65 12Z"
        fill={`url(#${gid})`} />
      <circle cx="65" cy="65" r="46" fill="none" stroke="rgba(255,200,180,0.22)" strokeWidth="1" />
      <circle cx="65" cy="65" r="42" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" />
      <text x="65" y="78" textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif"
        fontSize="42" fontWeight="500" fontStyle="italic"
        fill="rgba(255,220,200,0.85)"
        style={{ letterSpacing: '-0.04em' }}>
        DK
      </text>
    </svg>
  );
}
function WaxSeal({ stampT, breakT }: { stampT: number; breakT: number }) {
  const st = clamp(stampT, 0, 1);
  const stampScale   = 2.4 - 1.4 * easeOutBack(st);
  const stampOpacity = clamp(stampT * 2, 0, 1);
  const breakScale   = 1 + breakT * 0.4;
  const breakOpacity = 1 - breakT;
  const crackOpen    = breakT * 28;
  const opacity      = stampOpacity * breakOpacity;
  const scale        = stampT < 1 ? stampScale : breakScale;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 0,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity, width: 130, height: 130,
      filter: stampT < 0.4 ? `blur(${Math.max(0, (1 - stampT * 2.5) * 6)}px)` : 'none',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden', transform: `translateX(${-crackOpen}px) rotate(${-breakT * 8}deg)`, transformOrigin: 'right center' }}>
        <SealHalf side="left" />
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden', transform: `translateX(${crackOpen}px) rotate(${breakT * 8}deg)`, transformOrigin: 'left center' }}>
        <SealHalf side="right" />
      </div>
    </div>
  );
}

// ── Envelope ──────────────────────────────────────────────────────────────────
// Dimensions from scenes.jsx
const ENV_W = 576, ENV_H = 384, FLAP_H = 224;

function EnvelopeScene({ t }: { t: number }) {
  // Timeline matches scenes.jsx (~9s total)
  const flyT    = clamp((t - 0.0)  / 1.50, 0, 1);
  const stampT  = clamp((t - 1.4)  / 0.55, 0, 1);
  const breakT  = clamp((t - 2.35) / 0.40, 0, 1);
  const flapT   = clamp((t - 2.65) / 1.10, 0, 1);
  const fadeOut = clamp((t - 4.75) / 0.95, 0, 1);

  const flyY       = (1 - easeOutCubic(flyT)) * 700;
  const flyOpacity = clamp(flyT * 2, 0, 1);
  const flyScale   = 0.84 + 0.16 * easeOutCubic(flyT);
  const flyRot     = (1 - flyT) * -6;
  const fadeY      = easeInOutCubic(fadeOut) * 380;
  const fadeOpacity = 1 - fadeOut * 0.85;
  const fadeScale  = 1 - fadeOut * 0.08;
  const flapDeg    = -178 * easeInOutCubic(flapT);
  const flapShadow = Math.sin(flapT * Math.PI) * 0.25;

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: 1200,
      width: ENV_W, height: ENV_H,
      marginLeft: -ENV_W / 2, marginTop: -ENV_H / 2,
      transform: `translateY(${flyY + fadeY}px) scale(${flyScale * fadeScale}) rotate(${flyRot}deg)`,
      opacity: flyOpacity * fadeOpacity,
      perspective: 1800,
      transformStyle: 'preserve-3d',
    }}>
      {/* Back body */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${C.env} 0%, ${C.envShadow} 100%)`,
        borderRadius: 4,
        boxShadow: '0 30px 80px rgba(20,15,10,0.45), inset 0 0 60px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: FLAP_H,
          background: `linear-gradient(180deg, ${C.liningTop} 0%, ${C.liningBottom} 80%)`,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: FLAP_H,
          borderTop: `1px solid ${C.goldDeep}`, opacity: 0.18,
          clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
        }} />
      </div>
      {/* Bottom pocket */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: FLAP_H,
        background: `linear-gradient(180deg, ${C.envShadow} 0%, ${C.env} 100%)`,
        clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
        zIndex: 3,
      }} />
      {/* Flap */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: FLAP_H,
        transformOrigin: 'top center',
        transform: `rotateX(${flapDeg}deg)`,
        transformStyle: 'preserve-3d',
        zIndex: flapT > 0.5 ? 1 : 4,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${C.envFlap} 0%, ${C.env} 100%)`,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          backfaceVisibility: 'hidden',
          boxShadow: `inset 0 ${flapShadow * 40}px ${flapShadow * 60}px rgba(0,0,0,${(flapShadow * 0.4).toFixed(2)})`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(0deg, ${C.env} 0%, ${C.envShadow} 100%)`,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
        }} />
        <div style={{ position: 'absolute', left: '50%', top: FLAP_H - 8, transform: 'translateX(-50%)', backfaceVisibility: 'hidden' }}>
          <WaxSeal stampT={stampT} breakT={breakT} />
        </div>
      </div>
    </div>
  );
}

// ── Invitation Card ───────────────────────────────────────────────────────────
// Dimensions from scenes.jsx — settles at stage vertical center (y=960)
const CARD_W = 352, CARD_H = 496;

function InvitationCard({ t }: { t: number }) {
  const slideT   = clamp((t - 3.55) / 1.20, 0, 1);
  const contentT = clamp((t - 4.40) / 3.00, 0, 1);
  const y        = 1200 + (960 - 1200) * easeOutCubic(slideT);
  const opacity  = clamp(slideT * 3, 0, 1);
  const scale    = 0.92 + 0.08 * easeOutCubic(slideT);
  const sweep    = clamp(contentT, 0, 1);

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: y,
      width: CARD_W, height: CARD_H,
      marginLeft: -CARD_W / 2, marginTop: -CARD_H / 2,
      transform: `scale(${scale})`, opacity,
      borderRadius: 4,
      boxShadow: '0 40px 90px rgba(30,15,5,0.45), 0 12px 24px rgba(30,15,5,0.22), inset 0 0 0 1px rgba(120,90,50,0.12)',
      overflow: 'hidden', zIndex: 2, background: '#f6efde',
    }}>
      <img src="/card.png" alt="Davetiye" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.12) 110%)', pointerEvents: 'none' }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(110deg, transparent ${sweep * 100 - 30}%, rgba(255,255,255,0.4) ${sweep * 100}%, transparent ${sweep * 100 + 30}%)`,
        opacity: clamp((1 - sweep) * 2, 0, 0.9) * clamp(sweep * 3, 0, 1),
        mixBlendMode: 'soft-light',
      }} />
    </div>
  );
}

// ── IntroAnimation ────────────────────────────────────────────────────────────
type IntroAnimationProps = {
  onComplete?: () => void;
  embedded?: boolean;
  loop?: boolean;
  showSkip?: boolean;
};

export default function IntroAnimation({
  onComplete,
  embedded = false,
  loop = false,
  showSkip = true,
}: IntroAnimationProps) {
  const timeRef      = useRef(0);
  const lastTsRef    = useRef<number | null>(null);
  const rafRef       = useRef<number>();
  const wrapRef      = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const [t, setT]         = useState(0);
  const [fading, setFading] = useState(false);
  const [scale, setScale]  = useState(1);
  const particles = useMemo(() => makeParticles(40), []);

  // RAF loop
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;
      timeRef.current += dt;
      setT(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Auto-complete or loop
  useEffect(() => {
    if (t < COMPLETE_AT || completedRef.current) return;
    if (loop) {
      timeRef.current = 0;
      lastTsRef.current = null;
      setT(0);
      return;
    }
    // Animasyon doğal bitişi: RAF durdur, son kare donuk kalsın (fading yok)
    completedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, loop]);

  // Responsive scale
  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      const { clientWidth: w, clientHeight: h } = wrapRef.current;
      const contain = Math.min(w / SW, h / SH);
      const cover   = Math.max(w / SW, h / SH);
      // embedded uses cover (fills hero, stage center always visible)
      // standalone uses contain (no clipping)
      setScale(embedded ? cover : contain);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (wrapRef.current) ro?.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [embedded]);

  const finish = useCallback(() => {
    if (fading) return;
    setFading(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onComplete?.();
  }, [fading, onComplete]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: embedded ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: embedded ? 1 : 1000,
        background: '#73859b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 0.9s ease' : 'none',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Fixed-size stage scaled to fit viewport */}
      <div style={{
        width: SW, height: SH,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <Backdrop t={t} />
        <GoldDust t={t} particles={particles} />
        {t >= 3.45 && <InvitationCard t={t} />}
        {t >= 0.0  && <EnvelopeScene t={t} />}
        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.22) 115%)', pointerEvents: 'none', zIndex: 10 }} />
      </div>

      {/* Skip button (outside stage, always on top) */}
      {showSkip && (
      <button
        onClick={finish}
        style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.28)',
          color: 'rgba(255,255,255,0.6)',
          padding: '10px 28px',
          fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: "'Jost', 'Manrope', sans-serif", fontWeight: 300,
          borderRadius: 2, zIndex: 20,
        }}
      >
        Atla
      </button>
      )}
    </div>
  );
}
