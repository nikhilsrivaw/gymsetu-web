import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wallet, MessageCircle, MapPin, BarChart3, Sparkles, Smartphone,
  Dumbbell, ReceiptIndianRupee, Building2, ShieldCheck, ChevronLeft, ChevronRight,
  X, LayoutGrid, ArrowRight, Check,
} from 'lucide-react';

/*
 * /pitch — a swipeable sales deck for field marketers to walk a gym owner
 * through GymSetu, feature by feature, in Hinglish (the language the pitch
 * actually happens in). Every feature and its numbers are grounded in what the
 * product really does (FEATURES.md), not invented.
 *
 * It's a presenter tool: tap right half = next, left half = back; arrow keys,
 * swipe, and a jump-grid all work. Full-screen, no site chrome.
 */

type FeatureData = { icon: React.ComponentType<any>; tag: string; title: string; kya: string; kyun: string };

type Slide =
  | { kind: 'cover' }
  | { kind: 'problem' }
  | ({ kind: 'feature'; num: number; totalF: number } & FeatureData)
  | { kind: 'pricing' }
  | { kind: 'close' };

const FEATURES: FeatureData[] = [
  {
    icon: Users, tag: 'Members', title: 'Poora Member Record — Ek Jagah',
    kya: 'Har member ka photo, phone, plan aur history — sab aapke phone mein. Search karo, 2 second mein detail saamne.',
    kyun: 'Register phat jaata hai, page kho jaate hain. Yahaan kuch nahi khota — 500 member ho ya 50, sab handle ho jaata hai.',
  },
  {
    icon: Wallet, tag: 'Payments & Dues', title: 'Ek Rupaya Bhi Miss Nahi',
    kya: 'Cash, UPI, card — har payment record karo. Jiska paisa baaki hai, app khud red mein dikhata hai.',
    kyun: 'Mahine ke end mein hisaab dhoondhna band. Kiska due hai, kitna aaya — sab clear. Leakage ruk jaata hai.',
  },
  {
    icon: MessageCircle, tag: 'WhatsApp Reminders', title: 'Renewal Khud Yaad Dilata Hai',
    kya: 'Plan expire hone se 3 din pehle member ko khud WhatsApp chala jaata hai — aapko kuch karne ki zarurat nahi.',
    kyun: 'Members bhoolte hain, isliye chhodte hain. Auto-reminder se renewal badhte hain. Ek member ruka — app ka mahina nikal gaya.',
  },
  {
    icon: MapPin, tag: 'Attendance', title: 'Kaun Aaya, Kaun Gayab',
    kya: 'GPS se ya haath se attendance mark karo. Jo member 7-10 din se nahi aaya, app bata deta hai.',
    kyun: 'Member chupchaap chhodne se pehle warning mil jaati hai. Time pe ek call — aur woh wapas gym mein.',
  },
  {
    icon: BarChart3, tag: 'Reports & Insights', title: 'Business Ke Number Saamne',
    kya: 'Is mahine kitni kamai, kitne expire ho rahe hain, kaun chhodne wala hai, kab bheed hoti hai — ek dashboard.',
    kyun: 'Guess pe nahi, data pe decision. Kaunsa plan chal raha hai, kahan paisa ruk raha hai — sab dikhta hai.',
  },
  {
    icon: Sparkles, tag: 'AI Assistant', title: 'Diet & Workout — Seconds Mein',
    kya: 'AI se diet plan, workout plan aur growth tips turant ban jaate hain. Bas goal daalo, plan ready.',
    kyun: 'Bina extra trainer ke members ko professional service. Aapka gym bade gym jaisa feel deta hai.',
  },
  {
    icon: Smartphone, tag: 'Member App', title: 'Member Khud Sab Dekhe',
    kya: 'Member apne phone pe apna plan, diet, workout aur progress dekhta hai — 24x7.',
    kyun: 'Aapko baar baar batana nahi padta. Member ko gym modern lagta hai — woh gym ka naam doston ko batata hai.',
  },
  {
    icon: Dumbbell, tag: 'Trainers', title: 'Har Trainer Ka Apna Login',
    kya: 'Trainer apne members, unke plan aur progress sambhalta hai. Aap owner — poora control aapke paas.',
    kyun: 'Kaam bat jaata hai, par data aapka rehta hai. Trainer sirf apna dekhta hai, baaki gym safe.',
  },
  {
    icon: ReceiptIndianRupee, tag: 'GST Invoice', title: 'Professional Bill, Turant',
    kya: 'Payment ke saath GST bill apne aap ban jaata hai — member ko WhatsApp/print kar do.',
    kyun: 'Gym professional dikhta hai, member ko proper receipt milti hai, aur tax ka hisaab ready rehta hai.',
  },
  {
    icon: Building2, tag: 'Multi-Branch', title: 'Ek Se Zyada Branch?',
    kya: 'Saari branches ek jagah se chalao — har branch ke members, payments aur reports alag-alag.',
    kyun: 'Business bada ho raha hai toh GymSetu saath badhta hai. Ek phone se poora network aapke haath mein.',
  },
  {
    icon: ShieldCheck, tag: 'Data Safety', title: 'Aapka Data, Sirf Aapka',
    kya: 'Data India (Mumbai) ke server pe, roz backup, HTTPS secure. Har gym ka data poori tarah alag.',
    kyun: 'Members ki detail koi doosra gym nahi dekh sakta. Server band bhi ho jaaye, backup se sab wapas.',
  },
];

const PLANS = [
  { name: 'BASIC',    price: '999',   note: 'Kisi bhi size ka gym', popular: false },
  { name: 'PRO',      price: '1,699', note: '≤200 members · 7-din free trial', popular: true },
  { name: 'PRO PLUS', price: '2,199', note: '200–500 members', popular: false },
  { name: 'PRO MAX',  price: '2,999', note: '500+ members', popular: false },
];

// Ordered deck.
const SLIDES: Slide[] = [
  { kind: 'cover' },
  { kind: 'problem' },
  ...FEATURES.map((f, idx) => ({ kind: 'feature' as const, num: idx + 1, totalF: FEATURES.length, ...f })),
  { kind: 'pricing' },
  { kind: 'close' },
];

const slideLabel = (s: Slide) =>
  s.kind === 'cover' ? 'Intro'
  : s.kind === 'problem' ? 'Problem'
  : s.kind === 'pricing' ? 'Pricing'
  : s.kind === 'close' ? 'Shuru karein'
  : s.tag;

export const Pitch = () => {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [grid, setGrid] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = SLIDES.length;

  useEffect(() => { document.title = 'GymSetu — Demo'; }, []);

  const go = useCallback((to: number, d: 1 | -1) => {
    setDir(d);
    setI((prev) => Math.max(0, Math.min(n - 1, to)));
  }, [n]);
  const next = useCallback(() => go(i + 1, 1), [i, go]);
  const prev = useCallback(() => go(i - 1, -1), [i, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (grid) { if (e.key === 'Escape') setGrid(false); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') setGrid(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, grid]);

  const slide = SLIDES[i];

  return (
    <div className="fixed inset-0 z-[100] bg-ink text-bone overflow-hidden select-none"
         onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
         onTouchEnd={(e) => {
           if (touchX.current == null) return;
           const dx = e.changedTouches[0].clientX - touchX.current;
           if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
           touchX.current = null;
         }}>
      {/* Ambient */}
      <div className="hud-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 620, height: 620, top: -180, right: -140, background: 'radial-gradient(circle,#FF4D0026,transparent 65%)' }} />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/8 z-30">
        <div className="h-full bg-heat transition-[width] duration-300" style={{ width: `${((i + 1) / n) * 100}%` }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-7 pt-4 z-30">
        <img src="/gymsetu-logo.png" alt="GymSetu" className="h-7 md:h-8 w-auto" />
        <div className="flex items-center gap-3">
          <button onClick={() => setGrid(true)} aria-label="All slides"
            className="flex items-center gap-2 text-ash hover:text-bone font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md border border-hairline">
            <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Slides</span>
          </button>
          <Link to="/" aria-label="Exit" className="text-ash hover:text-bone"><X className="w-5 h-5" /></Link>
        </div>
      </div>

      {/* Tap zones (desktop + mobile) */}
      <button aria-label="Previous" onClick={prev}
        className="absolute left-0 top-0 bottom-0 w-[28%] z-10 cursor-w-resize disabled:cursor-default" disabled={i === 0} />
      <button aria-label="Next" onClick={next}
        className="absolute right-0 top-0 bottom-0 w-[38%] z-10 cursor-e-resize disabled:cursor-default" disabled={i === n - 1} />

      {/* Slide */}
      <div key={i} className="relative h-full w-full flex items-center justify-center px-6 md:px-10"
        style={{ animation: 'pitchIn .34s cubic-bezier(.22,.61,.36,1)' }}>
        <div className="w-full max-w-3xl mx-auto" style={{ ['--d' as any]: dir }}>
          {slide.kind === 'cover' && <Cover onStart={next} />}
          {slide.kind === 'problem' && <Problem />}
          {slide.kind === 'feature' && <Feature s={slide} index={slide.num} total={slide.totalF} />}
          {slide.kind === 'pricing' && <Pricing />}
          {slide.kind === 'close' && <Close />}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 md:px-7 pb-5 z-30">
        <button onClick={prev} disabled={i === 0}
          className="flex items-center gap-1.5 text-ash enabled:hover:text-bone disabled:opacity-25 font-mono text-[11px] uppercase tracking-wider">
          <ChevronLeft className="w-4 h-4" /> Peeche
        </button>
        <div className="font-mono text-[11px] text-ash tabular-nums tracking-widest">
          {String(i + 1).padStart(2, '0')} <span className="text-ash/40">/ {String(n).padStart(2, '0')}</span>
        </div>
        <button onClick={next} disabled={i === n - 1}
          className="flex items-center gap-1.5 text-flame enabled:hover:text-ember disabled:opacity-25 font-mono text-[11px] uppercase font-bold tracking-wider">
          Aage <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jump grid */}
      {grid && (
        <div className="absolute inset-0 z-40 bg-ink/95 backdrop-blur-md overflow-y-auto p-6 md:p-10"
          onClick={() => setGrid(false)}>
          <div className="max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-bone uppercase tracking-tight">Saari slides</h3>
              <button onClick={() => setGrid(false)} className="text-ash hover:text-bone"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SLIDES.map((s, idx) => (
                <button key={idx} onClick={() => { go(idx, idx > i ? 1 : -1); setGrid(false); }}
                  className={`text-left glass rounded-xl p-4 border transition-colors ${idx === i ? 'border-flame/50' : 'border-hairline hover:border-ash'}`}>
                  <div className="font-mono text-[10px] text-flame tabular-nums mb-1">{String(idx + 1).padStart(2, '0')}</div>
                  <div className="font-sans text-[13.5px] text-bone leading-snug">{slideLabel(s)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pitchIn {
          from { opacity: 0; transform: translateX(calc(var(--d, 1) * 34px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="pitchIn"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

// ── Slide types ──────────────────────────────────────────────────────────────
const Cover = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center">
    <img src="/gymsetu-logo.png" alt="GymSetu" className="h-24 md:h-32 w-auto mx-auto mb-8" />
    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-bone uppercase leading-[0.95] tracking-tight text-balance">
      Aapke gym ka <span className="text-heat">poora system</span><br />— ek app mein
    </h1>
    <p className="font-sans text-lg md:text-xl text-ash mt-6 max-w-xl mx-auto leading-relaxed">
      Members, payments, attendance, reminders — sab kuch.
      No register, no Excel, no tension.
    </p>
    <button onClick={onStart}
      className="inline-flex items-center gap-2.5 mt-10 bg-heat text-black px-7 py-4 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:gap-4 transition-all">
      Shuru karein <ArrowRight className="w-4 h-4" />
    </button>
    <p className="font-mono text-[11px] text-ash/50 uppercase tracking-widest mt-6">Tap ya swipe karke aage badhein</p>
  </div>
);

const Problem = () => (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-flame mb-4">Aaj ki problem</p>
    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-bone uppercase leading-[0.95] tracking-tight text-balance mb-8">
      Register aur Excel se gym <span className="text-heat">chalana mushkil</span> hai
    </h2>
    <div className="flex flex-col gap-3.5">
      {[
        'Kaun sa member expire ho gaya — yaad hi nahi rehta.',
        'Kiska payment baaki hai — dhoondhte reh jaate ho.',
        'Member gym aana band kar de — pata hi nahi chalta, aur woh chhod deta hai.',
        'Mahine ke end mein kamai ka hisaab — ghanton lag jaate hain.',
      ].map((t, k) => (
        <div key={k} className="flex gap-4 items-start glass rounded-xl px-5 py-4">
          <span className="flex-none w-7 h-7 rounded-full grid place-items-center text-flame bg-flame/10 border border-flame/30 font-bold text-sm">✕</span>
          <p className="font-sans text-[16px] md:text-[17px] text-bone/85 leading-snug pt-0.5">{t}</p>
        </div>
      ))}
    </div>
    <p className="font-sans text-lg text-bone mt-8">
      Yeh sab <b className="text-flame">GymSetu</b> solve karta hai. Dekhiye kaise 👇
    </p>
  </div>
);

const Feature = ({ s, index, total }: { s: FeatureData; index: number; total: number }) => {
  const Icon = s.icon;
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex-none w-12 h-12 rounded-xl grid place-items-center bg-flame/12 border border-flame/25">
          <Icon className="w-6 h-6 text-flame" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold text-ash">
            Feature {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')} · {s.tag}
          </p>
        </div>
      </div>

      <h2 className="font-display text-3xl sm:text-4xl md:text-[3.1rem] text-bone uppercase leading-[0.96] tracking-tight text-balance mb-7">
        {s.title}
      </h2>

      <div className="flex flex-col gap-4">
        <div className="glass rounded-2xl p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-flame mb-2">Kya hai</p>
          <p className="font-sans text-[17px] md:text-[19px] text-bone leading-relaxed">{s.kya}</p>
        </div>
        <div className="rounded-2xl p-5 md:p-6 border border-emerald-400/25 bg-emerald-400/[0.06]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Kyun zaroori hai
          </p>
          <p className="font-sans text-[16px] md:text-[18px] text-bone/90 leading-relaxed">{s.kyun}</p>
        </div>
      </div>
    </div>
  );
};

const Pricing = () => (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-flame mb-4">Pricing</p>
    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-bone uppercase leading-[0.95] tracking-tight text-balance mb-8">
      Har gym ke liye <span className="text-heat">ek plan</span>
    </h2>
    <div className="grid grid-cols-2 gap-3">
      {PLANS.map((p) => (
        <div key={p.name} className={`rounded-2xl p-5 border ${p.popular ? 'border-flame/50 bg-flame/[0.07]' : 'border-hairline glass'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-display text-lg text-bone uppercase tracking-tight">{p.name}</span>
            {p.popular && <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-flame bg-flame/15 border border-flame/30 rounded-full px-2 py-0.5">Popular</span>}
          </div>
          <div className="font-display text-3xl text-bone mb-1">₹{p.price}<span className="font-sans text-[13px] text-ash font-normal">/month</span></div>
          <p className="font-sans text-[13px] text-ash leading-snug">{p.note}</p>
        </div>
      ))}
    </div>
    <p className="font-sans text-[15px] text-ash mt-6 text-center">
      Saal ka lo toh aur sasta. <b className="text-bone">7 din free trial</b> — card ki zarurat nahi.
    </p>
  </div>
);

const Close = () => (
  <div className="text-center">
    <img src="/gymsetu-logo.png" alt="GymSetu" className="h-16 md:h-20 w-auto mx-auto mb-8" />
    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-bone uppercase leading-[0.95] tracking-tight text-balance">
      Register chhodiye.<br /><span className="text-heat">Gym ko digital</span> banaiye.
    </h2>
    <p className="font-sans text-lg text-ash mt-6 max-w-lg mx-auto leading-relaxed">
      Aaj hi free trial se shuru karein. 10 minute mein setup, aur aapka gym online.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
      <a href="https://wa.me/917905537549" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 bg-heat text-black px-7 py-4 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:gap-4 transition-all">
        WhatsApp pe baat karein <ArrowRight className="w-4 h-4" />
      </a>
      <Link to="/pricing"
        className="inline-flex items-center gap-2 border border-hairline text-bone px-7 py-4 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:border-ash transition-colors">
        Plans dekhein
      </Link>
    </div>
    <p className="font-mono text-[11px] text-ash/50 uppercase tracking-widest mt-8">GymSetu · a product by Aqirox Technology</p>
  </div>
);
