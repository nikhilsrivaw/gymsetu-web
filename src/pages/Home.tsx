import React, { useEffect, useRef, useState } from 'react';
import { WaitlistForm } from '../components/WaitlistForm';
import {
  ArrowRight, ArrowUpRight, Check, Phone, MoveHorizontal,
  IndianRupee, Users, Zap, TrendingUp, Sparkles, Dumbbell, FileText,
} from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { trackEvent } from '../lib/analytics';

/* verified Unsplash gym photography */
const img = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;
const IMG = {
  hero: '1534438327276-14e5300c3a48',
  grind: '1571902943202-507ec2618e8f',
  member: '1571019614242-c5c5dee9f50b',
  whatsapp: '1517836357463-d25dfeac3438',
  pay: '1594381898411-846e7d193883',
  ai: '1540497077202-7c8a3999166f',
  retention: '1581009146145-b5ef050c2e1e',
  memberPortal: '1549060279-7e168fcee0c2',
  cta: '1583454110551-21f2fa2afe61',
  stats: '1526506118085-60ce8714f8c5',
};

const rise = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-90px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
};
const wipe = {
  initial: { clipPath: 'inset(0 0 100% 0)' },
  whileInView: { clipPath: 'inset(0 0 0% 0)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const },
};

const Kicker = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[11px] uppercase tracking-[0.32em] ${className}`}>{children}</span>
);

/* word-by-word fade-up reveal for body copy */
const Words: React.FC<{ text: string; start?: number; per?: number; className?: string }> = ({ text, start = 0, per = 0.02, className = '' }) => (
  <span className={className} aria-label={text}>
    {text.split(' ').map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom">
        <motion.span aria-hidden="true" initial={{ y: '0.9em', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: start + i * per, ease: [0.16, 1, 0.3, 1] }} className="inline-block">
          {w}&nbsp;
        </motion.span>
      </span>
    ))}
  </span>
);

/* ── Feature index (magazine contents) ─────────────────────────── */
const INDEX = [
  { n: '01', title: 'Member Management', cap: 'Every member, plan and payment in one profile', img: IMG.member },
  { n: '02', title: 'WhatsApp Automation', cap: 'Reminders, renewals and win-backs, sent for you', img: IMG.whatsapp },
  { n: '03', title: 'Payments & GST', cap: 'UPI, cash and auto GST invoices — no dues lost', img: IMG.pay },
  { n: '04', title: 'AI Insights', cap: 'Churn signals, forecasts and growth moves', img: IMG.ai },
];

const IndexRow: React.FC<{ item: typeof INDEX[number]; i: number }> = ({ item, i }) => (
  <motion.div {...rise} transition={{ ...rise.transition, delay: i * 0.05 }}
    className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-10 border-t border-bone/15 py-6 md:py-8">
    <span className="font-serif italic text-2xl md:text-3xl text-flame">{item.n}</span>
    <div className="min-w-0 flex items-baseline gap-5 flex-wrap">
      <h3 className="font-display uppercase text-3xl sm:text-5xl md:text-6xl leading-none tracking-tight text-bone">{item.title}</h3>
      <span className="font-sans text-sm text-ash hidden md:block">{item.cap}</span>
    </div>
    {/* peeking thumbnail on hover */}
    <div className="relative h-16 w-24 md:h-20 md:w-32 overflow-hidden rounded-sm grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
      <img src={img(item.img, 400)} alt="" className="h-full w-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
    </div>
  </motion.div>
);

/* ── count-up ──────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1500) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now();
    const tick = (n: number) => {
      const p = Math.min((n - t0) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return { ref, val };
}
const CountUp = ({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) => {
  const { ref, val } = useCountUp(to);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
};

const SectionHead: React.FC<{ kicker: string; title: React.ReactNode; sub?: string; className?: string }> = ({ kicker, title, sub, className = '' }) => (
  <motion.div {...rise} className={className}>
    <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-flame" /><Kicker className="text-flame">{kicker}</Kicker></div>
    <h2 className="mt-4 font-display uppercase text-5xl md:text-7xl leading-[0.86] tracking-tight text-bone">{title}</h2>
    {sub && <p className="mt-5 font-serif text-lg md:text-xl text-bone/70 max-w-xl">{sub}</p>}
  </motion.div>
);

const BentoCard: React.FC<{ className?: string; children: React.ReactNode; delay?: number }> = ({ className = '', children, delay = 0 }) => (
  <motion.div {...rise} transition={{ ...rise.transition, delay }}
    className={`group relative overflow-hidden rounded-2xl border border-bone/12 bg-surface/50 p-6 hover:border-flame/40 transition-colors duration-500 ${className}`}>
    {children}
  </motion.div>
);

/* ── Auto-playing WhatsApp phone ───────────────────────────────── */
const WA_MSGS = [
  'Hi Rahul 👋 your Iron Fitness membership expires in 7 days. Renew now →',
  'Reminder: renew before Fri and save ₹200 🎉',
  'Your membership expired today. Tap to renew →',
  'We miss you at the gym! Come back — exclusive offer inside 💪',
];
const WhatsAppPhone = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-120px' });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    setN(0);
    const id = setInterval(() => setN(v => (v >= WA_MSGS.length ? 0 : v + 1)), 1500);
    return () => clearInterval(id);
  }, [inView]);
  return (
    <div ref={ref} className="relative mx-auto w-[300px]">
      <div className="rounded-[2.6rem] border-[10px] border-[#15151a] bg-[#0b141a] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-3 bg-[#1f2c34] px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-flame grid place-items-center text-black"><Dumbbell className="h-4 w-4" /></div>
          <div className="leading-tight">
            <div className="font-sans text-sm text-white">Iron Fitness</div>
            <div className="font-sans text-[10px] text-emerald-400">online · via GymSetu</div>
          </div>
        </div>
        {/* thread */}
        <div className="min-h-[340px] px-3 py-4 space-y-2 flex flex-col justify-end"
          style={{ background: 'linear-gradient(#0b141a,#0b141a)' }}>
          {WA_MSGS.slice(0, n).map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="self-end max-w-[82%] rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-white">
              <p className="font-sans text-[13px] leading-snug">{m}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/60">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                <Check className="h-3 w-3 text-sky-300 -ml-0.5" /><Check className="h-3 w-3 text-sky-300 -ml-2" />
              </div>
            </motion.div>
          ))}
          {n < WA_MSGS.length && (
            <div className="self-end rounded-xl bg-[#1f2c34] px-3 py-2"><span className="font-sans text-[11px] text-white/50">GymSetu is sending…</span></div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Interactive portal tabs ───────────────────────────────────── */
const PORTALS = [
  { tag: 'Owner', icon: TrendingUp, t: 'Run the business', pts: ['Members, plans & dues', 'Payments & GST invoices', 'AI insights & reports', 'WhatsApp automation'] },
  { tag: 'Member', icon: Dumbbell, t: 'Train with a coach', pts: ['Your plan & schedule', 'Log workouts & progress', 'AI diet plans', 'GPS check-in'] },
  { tag: 'Trainer', icon: Users, t: 'Coach your clients', pts: ['Build workout plans', 'Assign diet plans', 'Track client progress', 'Manage your day'] },
];
const Portals = () => {
  const [tab, setTab] = useState(0);
  const p = PORTALS[tab];
  const Icon = p.icon;
  return (
    <div>
      <div className="flex gap-2 mb-8">
        {PORTALS.map((x, i) => (
          <button key={x.tag} onClick={() => setTab(i)}
            className={`rounded-full px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${i === tab ? 'bg-flame text-black' : 'border border-bone/15 text-ash hover:text-bone'}`}>
            {x.tag}
          </button>
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-2 gap-8 items-center rounded-2xl border border-bone/12 bg-surface/50 p-8 md:p-12">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-heat text-black"><Icon className="h-6 w-6" /></span>
          <h3 className="mt-6 font-display uppercase text-4xl md:text-5xl leading-none tracking-tight text-bone">{p.t}</h3>
          <ul className="mt-6 space-y-3">
            {p.pts.map(pt => (
              <li key={pt} className="flex items-center gap-3 font-sans text-bone/85">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />{pt}
              </li>
            ))}
          </ul>
        </div>
        {/* mini mockup */}
        <div className="rounded-xl border border-bone/12 bg-ink p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ash">{p.tag} · App</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
          </div>
          <div className="mt-4 space-y-2">
            {p.pts.slice(0, 3).map((pt, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-bone/10 bg-surface/60 px-3 py-2.5">
                <span className="font-sans text-sm text-bone/80">{pt}</span>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Chaos → Calm interactive comparison ───────────────────────── */

const ChaosPanel = () => (
  <div className="absolute inset-0 bg-[#E8E0CB] text-[#2b2820] overflow-hidden">
    <div className="paper-lines absolute inset-0" />
    <div className="absolute right-[11%] top-[13%] h-20 w-20 rounded-full border-[5px] border-[#7a5230]/25 rotate-12" />
    <div className="relative h-full p-6 md:p-9">
      <div className="font-hand text-3xl md:text-4xl font-bold underline decoration-2 underline-offset-[6px] -rotate-1">Members — January</div>
      <div className="mt-5 space-y-3 font-hand text-2xl md:text-3xl max-w-[62%]">
        <div className="flex items-end gap-2"><span>Rahul S.</span><span className="flex-1 border-b border-dashed border-black/30 mb-2" /><span className="text-[#b3341f] font-bold">overdue?</span></div>
        <div className="flex items-end gap-2 line-through decoration-2 opacity-60"><span>Priya</span><span className="flex-1 mb-2" /><span>paid ✓</span></div>
        <div className="flex items-end gap-2"><span>Amit K.</span><span className="flex-1 border-b border-dashed border-black/30 mb-2" /><span className="text-[#b3341f] font-bold">?? ??</span></div>
        <div className="flex items-end gap-2"><span>Vikram</span><span className="flex-1 border-b border-dashed border-black/30 mb-2" /><span>call him!!</span></div>
      </div>
      <div className="absolute right-[6%] top-[30%] rotate-6">
        <div className="font-hand text-3xl md:text-5xl font-bold text-[#b3341f] leading-[0.9]">WHO<br />PAID??</div>
        <div className="absolute -inset-4 border-[3px] border-[#b3341f]/70 rounded-[46%] -rotate-6" />
      </div>
      <div className="absolute bottom-[15%] right-[8%] w-36 h-36 md:w-40 md:h-40 bg-[#ffe27a] rotate-6 shadow-[4px_7px_14px_rgba(0,0,0,0.22)] p-4 font-hand text-xl md:text-2xl text-[#3a3320] leading-tight">200 renewals due — message everyone 😩</div>
      <div className="absolute bottom-[9%] left-6 md:left-9 font-hand text-3xl md:text-4xl">Total: <span className="text-[#b3341f] font-bold">₹ ?????</span></div>
      <div className="absolute top-[7%] right-[30%] border-[3px] border-[#b3341f]/80 text-[#b3341f]/80 font-display uppercase text-lg md:text-xl px-3 py-0.5 -rotate-[14deg] tracking-wide">Overdue</div>
    </div>
  </div>
);

const CalmPanel = () => (
  <div className="absolute inset-0 bg-ink text-bone overflow-hidden">
    <div className="hud-grid absolute inset-0 opacity-40" />
    <div className="relative h-full p-6 md:p-9">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ash">GymSetu · Today</span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-400"><Check className="h-3.5 w-3.5" /> All dues cleared</span>
      </div>
      <div className="mt-7">
        <div className="font-display uppercase text-5xl md:text-6xl leading-none text-heat">₹48,250</div>
        <div className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-ash">Collected today · 0 pending</div>
      </div>
      <div className="mt-7 space-y-2 max-w-md ml-auto">
        {[['Rahul S.', 'Paid · Pro'], ['Priya', 'Paid · Monthly'], ['Amit K.', 'Renewed · Pro']].map(([n, s]) => (
          <div key={n} className="flex items-center justify-between rounded-lg border border-hairline bg-surface/60 px-4 py-3">
            <span className="font-sans text-bone">{n}</span>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-emerald-400"><Check className="h-3.5 w-3.5" />{s}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[8%] right-6 md:right-9 flex items-center gap-3 rounded-lg border border-hairline bg-surface/60 px-4 py-3 max-w-xs">
        <Phone className="h-4 w-4 text-flame shrink-0" />
        <span className="font-sans text-sm text-bone/85">3 reminders sent automatically</span>
        <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-auto" />
      </div>
    </div>
  </div>
);

const ChaosCalm = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [drag, setDrag] = useState(false);
  const set = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    setPos(Math.max(5, Math.min(95, ((clientX - r.left) / r.width) * 100)));
  };
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => set(e.clientX);
    const up = () => setDrag(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden select-none touch-none cursor-ew-resize"
      onPointerDown={(e) => { setDrag(true); set(e.clientX); }}>
      <CalmPanel />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><ChaosPanel /></div>
      {/* labels */}
      <span className="pointer-events-none absolute top-4 left-4 z-10 font-mono text-[10px] uppercase tracking-widest text-[#2b2820]/70">01 — The old way</span>
      <span className="pointer-events-none absolute top-4 right-4 z-10 font-mono text-[10px] uppercase tracking-widest text-bone/70">02 — With GymSetu</span>
      {/* divider + handle */}
      <div className="absolute top-0 bottom-0 z-20 -translate-x-1/2" style={{ left: `${pos}%` }}>
        <div className="mx-auto w-0.5 h-full bg-bone/85" />
        <motion.div animate={drag ? {} : { scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-flame text-black grid place-items-center shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <MoveHorizontal className="h-5 w-5" />
        </motion.div>
      </div>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────── */
export const Home = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  useEffect(() => { document.title = 'GymSetu — The Operating System for Indian Gyms'; }, []);
  const openTrial = (label: string) => { trackEvent('cta_click', { label, page: 'home' }); setShowWaitlist(true); };

  return (
    <main className="grain bg-ink text-bone overflow-x-hidden">

      {/* ── HERO — Chaos → Calm interactive ──────────────────────── */}
      <section className="relative min-h-screen flex flex-col bg-ink px-4 md:px-6 pt-28 md:pt-32 pb-6">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 bg-flame" />
            <Kicker className="text-flame">Your gym — before &amp; after</Kicker>
          </motion.div>

          <div className="mt-3 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1 className="font-display uppercase leading-[0.8] tracking-[-0.015em] text-bone">
              <span className="block text-6xl sm:text-7xl lg:text-8xl">The gym runs</span>
              <span className="block font-serif italic lowercase text-flame text-6xl sm:text-7xl lg:text-8xl -mt-1">itself.</span>
            </h1>
            <div className="flex flex-col lg:items-end gap-5 lg:max-w-sm">
              <p className="font-serif text-lg md:text-xl text-bone/80 lg:text-right">
                Drag the slider. Left is the notebook. Right is GymSetu — members, payments and WhatsApp, all automated.
              </p>
              <button onClick={() => openTrial('hero')}
                className="group relative overflow-hidden bg-flame text-black font-mono text-xs font-bold uppercase tracking-widest px-7 py-4 self-start lg:self-end">
                <span className="relative z-10 inline-flex items-center gap-3">Start free trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                <span className="absolute inset-0 bg-bone origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>

        {/* the interactive exhibit */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full mt-7 flex-1 min-h-[54vh] relative rounded-xl overflow-hidden border border-bone/15 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
          <ChaosCalm />
        </motion.div>
      </section>

      {/* ── STATEMENT ────────────────────────────────────────────── */}
      <section className="bg-ink px-6 py-24 md:py-32 border-t border-bone/10">
        <div className="max-w-5xl mx-auto">
          <motion.p {...rise} className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.15] text-bone">
            You didn't open a gym to spend evenings chasing renewals on WhatsApp.
            <span className="text-ash"> GymSetu takes the busywork off your floor — </span>
            <span className="italic text-flame">so the only thing you manage is the workout.</span>
          </motion.p>
        </div>
      </section>

      {/* ── BENTO FEATURE GRID ───────────────────────────────────── */}
      <section id="index" className="bg-ink-2 border-t border-bone/10 px-6 py-24 md:py-32 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHead kicker="Everything the front desk needs" title={<>One app. <span className="font-serif italic lowercase text-flame">zero busywork.</span></>} />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Payments — big live dashboard */}
            <BentoCard className="md:col-span-4 md:row-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-flame" /><span className="font-mono text-[11px] uppercase tracking-widest text-ash">Payments · Today</span></div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400"><Check className="h-3 w-3" />0 pending</span>
              </div>
              <div className="mt-5 font-display uppercase text-6xl md:text-7xl leading-none text-heat"><CountUp to={48250} prefix="₹" /></div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ash">Collected · all dues cleared</div>
              <div className="mt-6 grid sm:grid-cols-2 gap-2">
                {[['Rahul S.', 'Paid · Pro'], ['Priya', 'Paid · Monthly'], ['Amit K.', 'Renewed'], ['Neha', 'UPI · ₹1,000']].map(([n, s]) => (
                  <div key={n} className="flex items-center justify-between rounded-lg border border-bone/10 bg-ink/60 px-3 py-2.5">
                    <span className="font-sans text-sm text-bone/85">{n}</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-400"><Check className="h-3 w-3" />{s}</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* WhatsApp — message stack */}
            <BentoCard className="md:col-span-2 md:row-span-2" delay={0.06}>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-flame" /><span className="font-mono text-[11px] uppercase tracking-widest text-ash">WhatsApp · Auto</span></div>
              <h3 className="mt-3 font-display uppercase text-2xl leading-none text-bone">Renewals on autopilot</h3>
              <div className="mt-5 space-y-2">
                {['Expires in 7 days →', 'Renew & save ₹200', 'Reminder sent'].map((m, i) => (
                  <div key={i} className="rounded-lg rounded-tr-sm bg-[#005c4b]/90 px-3 py-2 ml-auto max-w-[90%] w-fit">
                    <p className="font-sans text-[12px] text-white">{m}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 font-serif italic text-bone/60 text-sm">Sent from your own number.</div>
            </BentoCard>

            {/* Members */}
            <BentoCard className="md:col-span-2" delay={0.1}>
              <Users className="h-5 w-5 text-flame" />
              <h3 className="mt-3 font-display uppercase text-xl leading-none text-bone">Members</h3>
              <p className="mt-2 font-sans text-sm text-ash">Every profile, plan &amp; history in one place.</p>
            </BentoCard>

            {/* GST */}
            <BentoCard className="md:col-span-2" delay={0.14}>
              <FileText className="h-5 w-5 text-flame" />
              <h3 className="mt-3 font-display uppercase text-xl leading-none text-bone">GST invoices</h3>
              <p className="mt-2 font-sans text-sm text-ash">Auto-generated on every payment.</p>
            </BentoCard>

            {/* AI */}
            <BentoCard className="md:col-span-2" delay={0.18}>
              <div className="flex items-center justify-between">
                <Sparkles className="h-5 w-5 text-flame" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-flame">3 at risk</span>
              </div>
              <h3 className="mt-3 font-display uppercase text-xl leading-none text-bone">AI insights</h3>
              <p className="mt-2 font-sans text-sm text-ash">Churn signals &amp; revenue forecasts.</p>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── WHATSAPP SHOWCASE ────────────────────────────────────── */}
      <section className="bg-ink border-t border-bone/10 px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <SectionHead kicker="Retention, automated" title={<>Stop chasing<br />members <span className="font-serif italic lowercase text-flame">by hand.</span></>}
            sub="A four-message renewal sequence fires on its own — reminder, offer, expiry, win-back — from your own approved WhatsApp number." />
          <div className="relative">
            <div className="glow-orb animate-float-glow bg-flame/25 h-72 w-72 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
            <WhatsAppPhone />
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="font-display text-5xl text-flame leading-none">35%</span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ash leading-tight">fewer expired<br />memberships / month</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="bg-ink-2 border-y border-bone/10 px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-bone/12">
          {[
            { node: <CountUp to={500} suffix="+" />, l: 'Gyms running on GymSetu' },
            { node: <CountUp to={50000} suffix="+" />, l: 'Members managed' },
            { node: <>4.9<span className="text-flame">★</span></>, l: 'Average app rating' },
          ].map((s, i) => (
            <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.08 }} className="px-4 md:px-10 py-8 md:py-4 text-center md:text-left">
              <div className="font-display uppercase text-6xl md:text-7xl text-bone leading-none">{s.node}</div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ash">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PORTALS (interactive tabs) ───────────────────────────── */}
      <section className="bg-ink px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <SectionHead kicker="Three doors, one system" title={<>One app. <span className="font-serif italic lowercase text-flame">three portals.</span></>} className="mb-12" />
          <Portals />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-2 border-t border-bone/10">
        <div className="glow-orb animate-float-glow bg-flame/35 h-[34rem] w-[34rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 md:py-40 text-center">
          <motion.div {...rise} className="flex items-center justify-center gap-3"><span className="h-1.5 w-1.5 bg-flame" /><Kicker className="text-flame">Your gym, upgraded</Kicker></motion.div>
          <motion.h2 {...rise} className="mt-6 font-display uppercase text-[15vw] md:text-[9vw] leading-[0.85] tracking-tight text-bone">
            Ready to run<br />a <span className="font-serif italic lowercase text-flame">better gym?</span>
          </motion.h2>
          <motion.div {...rise} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
            <button onClick={() => openTrial('footer')}
              className="group relative overflow-hidden bg-flame text-black font-mono text-xs font-bold uppercase tracking-widest px-9 py-4">
              <span className="relative z-10 inline-flex items-center gap-3">Start free trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
              <span className="absolute inset-0 bg-bone origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-widest text-bone/60">No card required</span>
          </motion.div>
        </div>
      </section>

      {showWaitlist && <WaitlistForm plan="pro" onClose={() => setShowWaitlist(false)} />}
    </main>
  );
};
