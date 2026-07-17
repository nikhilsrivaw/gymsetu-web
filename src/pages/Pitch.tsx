import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wallet, MapPin, Dumbbell, Smartphone, BarChart3, ReceiptIndianRupee,
  MessageCircle, Sparkles, TrendingUp, UserMinus, Bot, Building2, ShieldCheck,
  ChevronLeft, ChevronRight, X, LayoutGrid, ArrowRight, Check, Layers, Rocket,
} from 'lucide-react';

/*
 * /pitch — Hinglish sales deck for field marketers.
 *
 * Basic plan REMOVED. Pro (₹1,699) is now the entry plan, and every plan
 * (Pro / Pro Plus / Pro Max) includes ALL features — they differ only by gym
 * size (members / branches / WhatsApp+AI tokens). So the deck's message is
 * "saare features har plan mein — plan sirf gym ke size se". Each feature shows
 * a "Har plan mein" badge (multi-branch shows "Add-on"). Grounded in the live
 * pricing page (src/pages/Pricing.tsx). Sectioned: daily tools → smart features
 * → "sab included" recap → pricing.
 */

type Tier = 'basic' | 'pro' | 'proplus';
type FeatureData = { icon: React.ComponentType<any>; tag: string; tier: Tier; title: string; kya: string; kyun: string };

const CORE: FeatureData[] = [
  {
    icon: Users, tag: 'Members', tier: 'basic', title: 'Poora Member Record — Ek Jagah',
    kya: 'Har member ka photo, phone, plan, joining date aur poori history — sab ek jagah. Naam ya number se search karo, detail turant saamne.',
    kyun: 'Register phat-ta hai, entries kho jaati hain. Yahaan 50 ho ya 500 member — sab safe. Naya staff bhi 5 minute mein seekh jaata hai.',
  },
  {
    icon: Wallet, tag: 'Payments & Dues', tier: 'basic', title: 'Ek Rupaya Bhi Miss Nahi',
    kya: 'Cash, UPI, card, bank — har payment record. Kis member ka kitna due hai, app khud red mein dikhata hai. Partial payment bhi track.',
    kyun: 'Ek bhi rupaya leak nahi hota. Diary mein hisaab dhoondhna khatam. Kaun defaulter hai, ek nazar mein pata.',
  },
  {
    icon: MapPin, tag: 'Attendance', tier: 'basic', title: 'Kaun Aaya, Kaun Gayab',
    kya: 'Member aaya ya nahi — GPS check-in se, ya owner/trainer haath se mark kare. Roz ka record apne aap ban-ta hai.',
    kyun: 'Jo member gayab ho raha hai, app warning deta hai. Chhodne se pehle pata chal jaata hai — time pe call, member wapas.',
  },
  {
    icon: BarChart3, tag: 'Reports', tier: 'basic', title: 'Business Ke Number Saamne',
    kya: 'Revenue report, member report, attendance trend, aur expiry list — kaun kis din expire ho raha hai. Har plan mein.',
    kyun: 'Guess nahi, data pe decision. Kitni kamai hui, kitne naye aaye, kab bheed hoti hai — business samajh aata hai.',
  },
  {
    icon: Dumbbell, tag: 'Trainers', tier: 'basic', title: 'Har Trainer Ka Apna Login',
    kya: 'Har trainer ko apna login. Woh apne assigned members, unke plan aur progress dekhta hai — aap poora gym control karte ho.',
    kyun: 'Kaam bat jaata hai bina control khoye. Trainer sirf apna dekhe, baaki data owner ke paas safe.',
  },
  {
    icon: Smartphone, tag: 'Member App', tier: 'basic', title: 'Member Khud Sab Dekhe',
    kya: 'Member apne phone pe apna plan, dues, diet, workout aur progress khud dekhta hai — 24 ghante.',
    kyun: 'Aapko baar-baar batana nahi padta. Gym modern lagta hai — khush member naye members refer karta hai.',
  },
  {
    icon: ReceiptIndianRupee, tag: 'GST Invoice', tier: 'basic', title: 'Professional Bill, Turant',
    kya: 'Payment ke saath GST bill apne aap ban jaata hai — member ko WhatsApp ya print kar do.',
    kyun: 'Gym professional dikhta hai, member ko proper receipt milti hai, aur tax ka hisaab already ready.',
  },
];

const PRO: FeatureData[] = [
  {
    icon: MessageCircle, tag: 'WhatsApp Automation', tier: 'pro', title: 'Reminders — Bina Aapke Kuch Kiye',
    kya: 'Plan expire hone se 3 din pehle member ko khud WhatsApp jaata hai. Welcome message, payment confirmation, announcement — sab automatic.',
    kyun: 'Members bhoolte hain isliye chhodte hain. Auto-reminder = zyada renewals. Ek member ruka toh app ka poora mahina nikal gaya.',
  },
  {
    icon: Sparkles, tag: 'AI Insights & Reports', tier: 'pro', title: 'AI Aapko Business Advice Deta Hai',
    kya: 'AI aapke gym ka data padhkar batata hai — kya achha chal raha hai, kahan dhyan dena hai. Aur roz ka summary khud likhkar deta hai.',
    kyun: 'Bina kisi analyst ke, aapko business advice milti hai. Chote decisions data pe lo, bada result milta hai.',
  },
  {
    icon: TrendingUp, tag: 'Revenue Forecast', tier: 'pro', title: 'Agle 3 Mahine Ki Kamai Pehle Se',
    kya: 'Kitne plan kab expire ho rahe hain aur purane data se — app agle 3 mahine ki kamai ka projection dikhata hai.',
    kyun: 'Pehle se pata ki kaunsa mahina slow rahega. Us hisaab se offer aur planning — cash flow ki tension khatam.',
  },
  {
    icon: UserMinus, tag: 'Churn Early Warning', tier: 'pro', title: 'Member Chhodne Se Pehle Alert',
    kya: 'App batata hai kaun member chhodne wala hai — kam attendance + expiry paas aane pe khud alert karta hai.',
    kyun: 'Member chup-chaap nahi jaayega. Pehle se alert, time pe ek call ya offer — retention badhta hai, kamai bachti hai.',
  },
  {
    icon: Bot, tag: 'AI Diet & Workout', tier: 'pro', title: 'Diet & Workout Plan — Seconds Mein',
    kya: 'Member ya trainer bas goal daale — AI turant personal diet aur workout plan bana deta hai.',
    kyun: 'Bina extra nutritionist ke professional service. Member ko personal attention feel hota hai — woh gym chhodta nahi.',
  },
];

const SCALE: FeatureData = {
  icon: Building2, tag: 'Multi-Branch', tier: 'proplus', title: 'Ek Se Zyada Branch? Sab Ek Jagah',
  kya: 'Har branch ke members, payments, attendance aur reports alag-alag — sab ek owner login se manage karo.',
  kyun: 'Business bada ho raha hai toh GymSetu saath badhta hai. Poora network ek phone se control mein.',
};

const TRUST: FeatureData = {
  icon: ShieldCheck, tag: 'Data Safety', tier: 'basic', title: 'Aapka Data, Sirf Aapka',
  kya: 'Data India (Mumbai) ke server pe, roz backup, HTTPS secure. Har gym ka data poori tarah alag.',
  kyun: 'Members ki detail koi doosra gym nahi dekh sakta. Server band bhi ho jaaye, backup se sab wapas.',
};

const PLANS = [
  { name: 'PRO', price: '1,699', who: '≤200 members · sabse popular',
    has: ['Members, attendance & payments', 'GST invoices & reports', 'WhatsApp automation', 'AI Insights, Forecast & Churn', 'AI diet & workout', '7-din free trial'], popular: true },
  { name: 'PRO PLUS', price: '2,199', who: '200–500 members',
    has: ['Sab kuch Pro ka', '1,000 WhatsApp tokens', 'Branch add-on'], popular: false },
  { name: 'PRO MAX', price: '2,999', who: '500+ members',
    has: ['Sab kuch Pro Plus ka', 'Advanced analytics', 'Priority support'], popular: false },
];

// ── Deck order ───────────────────────────────────────────────────────────────
type Slide =
  | { kind: 'cover' }
  | { kind: 'problem' }
  | { kind: 'divider'; sec: string; title: string; sub: string; icon: React.ComponentType<any> }
  | ({ kind: 'feature'; num: number; totalF: number } & FeatureData)
  | { kind: 'prorecap' }
  | { kind: 'pricing' }
  | { kind: 'close' };

const ALL_FEATURES = [...CORE, ...PRO, SCALE, TRUST];
const F = (f: FeatureData): Slide => ({ kind: 'feature', num: ALL_FEATURES.indexOf(f) + 1, totalF: ALL_FEATURES.length, ...f });

const SLIDES: Slide[] = [
  { kind: 'cover' },
  { kind: 'problem' },
  { kind: 'divider', sec: 'Section 1', title: 'Core Features', sub: 'Jo har plan mein milte hain', icon: Layers },
  ...CORE.map(F),
  { kind: 'divider', sec: 'Section 2', title: 'Smart Features', sub: 'AI, reports aur automation — har plan mein', icon: Rocket },
  ...PRO.map(F),
  F(SCALE),
  F(TRUST),
  { kind: 'prorecap' },
  { kind: 'pricing' },
  { kind: 'close' },
];

const slideLabel = (s: Slide) =>
  s.kind === 'cover' ? 'Intro'
  : s.kind === 'problem' ? 'Problem'
  : s.kind === 'divider' ? s.title
  : s.kind === 'prorecap' ? 'Pro recap'
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

  const go = useCallback((to: number, d: 1 | -1) => { setDir(d); setI(Math.max(0, Math.min(n - 1, to))); }, [n]);
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
      <div className="hud-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 620, height: 620, top: -180, right: -140, background: 'radial-gradient(circle,#FF4D0026,transparent 65%)' }} />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/8 z-30">
        <div className="h-full bg-heat transition-[width] duration-300" style={{ width: `${((i + 1) / n) * 100}%` }} />
      </div>

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

      <button aria-label="Previous" onClick={prev}
        className="absolute left-0 top-0 bottom-0 w-[28%] z-10 cursor-w-resize disabled:cursor-default" disabled={i === 0} />
      <button aria-label="Next" onClick={next}
        className="absolute right-0 top-0 bottom-0 w-[38%] z-10 cursor-e-resize disabled:cursor-default" disabled={i === n - 1} />

      <div key={i} className="relative h-full w-full flex items-center justify-center px-6 md:px-10 overflow-y-auto py-20"
        style={{ animation: 'pitchIn .34s cubic-bezier(.22,.61,.36,1)' }}>
        <div className="w-full max-w-3xl mx-auto" style={{ ['--d' as any]: dir }}>
          {slide.kind === 'cover' && <Cover onStart={next} />}
          {slide.kind === 'problem' && <Problem />}
          {slide.kind === 'divider' && <Divider s={slide} />}
          {slide.kind === 'feature' && <Feature s={slide} index={slide.num} total={slide.totalF} />}
          {slide.kind === 'prorecap' && <ProRecap />}
          {slide.kind === 'pricing' && <Pricing />}
          {slide.kind === 'close' && <Close />}
        </div>
      </div>

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

      {grid && (
        <div className="absolute inset-0 z-40 bg-ink/95 backdrop-blur-md overflow-y-auto p-6 md:p-10" onClick={() => setGrid(false)}>
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
        @keyframes pitchIn { from { opacity:0; transform: translateX(calc(var(--d,1) * 34px)); } to { opacity:1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="pitchIn"] { animation: none !important; } }
      `}</style>
    </div>
  );
};

// ── Slides ───────────────────────────────────────────────────────────────────
const Cover = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center">
    <img src="/gymsetu-logo.png" alt="GymSetu" className="h-24 md:h-32 w-auto mx-auto mb-8" />
    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-bone uppercase leading-[0.95] tracking-tight text-balance">
      Aapke gym ka <span className="text-heat">poora system</span><br />— ek app mein
    </h1>
    <p className="font-sans text-lg md:text-xl text-ash mt-6 max-w-xl mx-auto leading-relaxed">
      Members, payments, attendance, reminders aur reports — sab kuch. No register, no Excel, no tension.
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
        'Member gym aana band kar de — pata hi nahi chalta, woh chhod deta hai.',
        'Kamai badh rahi hai ya ghat — koi clear hisaab nahi.',
      ].map((t, k) => (
        <div key={k} className="flex gap-4 items-start glass rounded-xl px-5 py-4">
          <span className="flex-none w-7 h-7 rounded-full grid place-items-center text-flame bg-flame/10 border border-flame/30 font-bold text-sm">✕</span>
          <p className="font-sans text-[16px] md:text-[17px] text-bone/85 leading-snug pt-0.5">{t}</p>
        </div>
      ))}
    </div>
    <p className="font-sans text-lg text-bone mt-8">Yeh sab <b className="text-flame">GymSetu</b> solve karta hai. Dekhiye kaise 👇</p>
  </div>
);

const Divider = ({ s }: { s: Extract<Slide, { kind: 'divider' }> }) => {
  const Icon = s.icon;
  return (
    <div className="text-center">
      <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-flame/12 border border-flame/25 mx-auto mb-6">
        <Icon className="w-8 h-8 text-flame" />
      </span>
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] font-bold text-ash mb-3">{s.sec}</p>
      <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-bone uppercase leading-[0.92] tracking-tight text-balance">
        {s.title}
      </h2>
      <p className="font-sans text-lg md:text-xl text-ash mt-4">{s.sub}</p>
    </div>
  );
};

const Feature = ({ s, index, total }: { s: FeatureData; index: number; total: number }) => {
  const Icon = s.icon;
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex-none w-12 h-12 rounded-xl grid place-items-center bg-flame/12 border border-flame/25">
          <Icon className="w-6 h-6 text-flame" />
        </span>
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-ash">
            {String(index).padStart(2, '0')}/{String(total).padStart(2, '0')} · {s.tag}
          </p>
          {s.tier === 'proplus'
            ? <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border text-amber border-amber/40 bg-amber/10">Add-on</span>
            : <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/40 bg-emerald-400/10">Har plan mein</span>}
        </div>
      </div>

      <h2 className="font-display text-3xl sm:text-4xl md:text-[2.9rem] text-bone uppercase leading-[0.98] tracking-tight text-balance mb-6">
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

const ProRecap = () => (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-flame mb-4">Sab kuch included</p>
    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-bone uppercase leading-[0.95] tracking-tight text-balance mb-3">
      Har plan mein <span className="text-heat">yeh sab</span> milta hai
    </h2>
    <p className="font-sans text-[15px] text-ash mb-6">Chhota gym ho ya bada — saare features same. Plan sirf aapke gym ke size se choose karo:</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {[
        ['WhatsApp automatic reminders', 'Renewals khud yaad dilata hai'],
        ['AI Insights & daily reports', 'Business advice, roz ka summary'],
        ['Revenue Forecast', 'Agle 3 mahine ki kamai pehle se'],
        ['Churn Early Warning', 'Chhodne wale member ka alert'],
        ['AI Diet & Workout plans', 'Seconds mein personal plan'],
        ['7-din free trial', 'Card ki zarurat nahi'],
      ].map(([t, d]) => (
        <div key={t} className="flex gap-3 glass rounded-xl px-4 py-3.5">
          <Check className="w-5 h-5 text-emerald-400 flex-none mt-0.5" strokeWidth={3} />
          <div><div className="font-sans text-[15px] text-bone font-semibold leading-snug">{t}</div>
            <div className="font-sans text-[12.5px] text-ash leading-snug">{d}</div></div>
        </div>
      ))}
    </div>
    <div className="mt-6 flex items-baseline gap-2">
      <span className="font-sans text-[14px] text-ash">Shuru</span>
      <span className="font-display text-4xl text-bone">₹1,699</span>
      <span className="font-sans text-[14px] text-ash">/month se · 7-din free trial</span>
    </div>
  </div>
);

const Pricing = () => (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-flame mb-4">Pricing</p>
    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-bone uppercase leading-[0.95] tracking-tight text-balance mb-7">
      Har gym ke liye <span className="text-heat">ek plan</span>
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PLANS.map((p) => (
        <div key={p.name} className={`rounded-2xl p-5 border ${p.popular ? 'border-flame/50 bg-flame/[0.07]' : 'border-hairline glass'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-display text-lg text-bone uppercase tracking-tight">{p.name}</span>
            {p.popular && <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-flame bg-flame/15 border border-flame/30 rounded-full px-2 py-0.5">Popular</span>}
          </div>
          <div className="font-display text-3xl text-bone">₹{p.price}<span className="font-sans text-[13px] text-ash font-normal">/mo</span></div>
          <p className="font-sans text-[12px] text-ash mb-3 mt-0.5">{p.who}</p>
          <ul className="flex flex-col gap-1.5">
            {p.has.map((f) => (
              <li key={f} className="flex gap-2 items-start font-sans text-[13px] text-bone/85 leading-snug">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-none mt-0.5" strokeWidth={3} />{f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <p className="font-sans text-[15px] text-ash mt-5 text-center"><b className="text-bone">Saare features har plan mein</b> — plan sirf gym ke size se. Quarterly/yearly pe 8–15% sasta, Pro pe 7-din free trial.</p>
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
