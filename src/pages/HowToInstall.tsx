import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone, Apple, ShieldCheck, Check, X, AlertTriangle,
  MoreVertical, Share, Info, ArrowRight,
} from 'lucide-react';
import { SUPPORT_EMAIL } from '../lib/constants';

const APP_URL = 'https://app.gymsetu.it.com';

const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-flame';

// A numbered procedure step.
const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="flex gap-4 py-4 border-t border-hairline first:border-t-0">
    <span className="flex-none w-8 h-8 rounded-full grid place-items-center font-mono text-sm font-bold
                     text-flame bg-flame/10 border border-flame/30 tabular-nums">{n}</span>
    <div className="pt-0.5">
      <h4 className="font-sans text-[16px] text-bone font-semibold mb-0.5">{title}</h4>
      <p className="font-sans text-[14px] text-ash leading-relaxed">{children}</p>
    </div>
  </li>
);

// A key on-screen control (⋮ menu, share glyph) rendered inline.
const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-grid place-items-center min-w-[22px] h-[22px] px-1.5 align-middle
                   border border-hairline rounded-md bg-black text-bone text-[13px] leading-none">{children}</span>
);

// A safety Q/A verdict row.
const Verdict = ({ tone, q, children }: { tone: 'ok' | 'no' | 'care'; q: string; children: React.ReactNode }) => {
  const style = {
    ok:   { ring: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/35', icon: <Check className="w-4 h-4" strokeWidth={3} /> },
    no:   { ring: 'text-flame bg-flame/10 border-flame/30',                    icon: <X className="w-4 h-4" strokeWidth={3} /> },
    care: { ring: 'text-amber bg-amber/10 border-amber/35',                    icon: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  }[tone];
  return (
    <div className="flex gap-4 py-4 border-t border-hairline first:border-t-0 items-start">
      <span className={`flex-none w-7 h-7 rounded-full grid place-items-center border ${style.ring} mt-0.5`}>{style.icon}</span>
      <div>
        <div className="font-sans text-[16px] text-bone font-semibold mb-0.5">{q}</div>
        <div className="font-sans text-[14.5px] text-ash leading-relaxed max-w-[60ch]">{children}</div>
      </div>
    </div>
  );
};

export const HowToInstall = () => {
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    document.title = 'How to install GymSetu | GymSetu';
    const ua = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua) || ((navigator as any).platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (/android/i.test(ua)) setPlatform('android');
    else if (isIOS) setPlatform('ios');
  }, []);

  return (
    <main className="relative bg-ink pt-28 md:pt-40 pb-24 px-4 md:px-6 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 520, height: 520, top: -140, right: -80, background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <p className={EYEBROW}>Setup guide</p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-bone uppercase leading-[0.9] tracking-tight mt-4 mb-6">
          Install the app.<br />And yes — <span className="text-heat">it’s safe.</span>
        </h1>
        <p className="font-sans text-lg text-ash max-w-[60ch] leading-relaxed">
          GymSetu installs straight from the web onto your phone — no Play Store, no App Store, no waiting.
          Here’s every step for Android and iPhone, and a plain explanation of why it’s safe to do.
        </p>

        {platform && (
          <div className="mt-7 flex items-center gap-3 glass rounded-xl px-4 py-3 border border-flame/30 bg-flame/[0.06]">
            <span className="w-2 h-2 rounded-full bg-flame flex-none shadow-[0_0_0_4px_rgba(255,77,0,0.15)]" />
            <p className="font-sans text-[14.5px] text-bone">
              Looks like you’re on <b>{platform === 'android' ? 'Android' : 'iPhone'}</b> — your steps are in{' '}
              <a href={platform === 'android' ? '#android' : '#iphone'} className="text-flame font-semibold">Installing on your phone</a>.
            </p>
          </div>
        )}

        {/* 01 — what it is */}
        <Section n="01" eyebrow="The idea" title="What you’re installing">
          <p>
            GymSetu is a <b className="text-bone">Progressive Web App</b> — an app that lives on the web and can be added
            to your phone’s home screen. Once added, it opens full-screen with its own icon and behaves like any other app.
            The only difference is how it gets there: instead of downloading a big file from a store, your phone simply
            <b className="text-bone"> saves the website</b> and keeps it ready.
          </p>
          <p>That’s why there’s no file to download and no store to search. You open a link, tap “install,” and it’s on your home screen in seconds.</p>
          <Callout tone="tip" icon={<Info className="w-4 h-4" />}>
            <b className="text-bone">One app, three logins.</b> The same install works for the gym owner, trainers, and members —
            each logs in with their own details and sees their own screens. You install once and share the same link with your team.
          </Callout>
        </Section>

        {/* 02 — open in browser first */}
        <Section n="02" eyebrow="Do this first" title="Open the link in your browser">
          <p>
            You’ll usually get the install link over <b className="text-bone">WhatsApp</b>. If you tap it there, it opens inside
            WhatsApp’s own little browser — and installing to the home screen <b className="text-bone">doesn’t work from inside another app</b>.
            This is the single most common reason people think “it didn’t install.”
          </p>
          <Callout tone="warn" icon={<AlertTriangle className="w-4 h-4" />}>
            Before installing, open the link in your real browser: on Android tap the <Key><MoreVertical className="w-3.5 h-3.5" /></Key> menu
            and choose <b className="text-bone">Open in Chrome</b>; on iPhone tap the <b className="text-bone">compass / Safari</b> icon.
            The install page detects this and tells you.
          </Callout>
        </Section>

        {/* 03 — the two platforms */}
        <Section n="03" eyebrow="Step by step" title="Installing on your phone">
          <p>Pick your phone. Android is one tap; iPhone takes a couple more because Apple does it differently — both end with a real app icon on your home screen.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 items-start">
            {/* Android */}
            <div id="android" className="glass rounded-2xl p-6 scroll-mt-24">
              <div className="flex items-center gap-3 mb-1">
                <Smartphone className="w-6 h-6 text-flame" />
                <span className="font-display text-xl text-bone uppercase tracking-tight">Android</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2.5 py-1">One tap</span>
              </div>
              <p className="font-sans text-[13px] text-ash mb-3">Chrome browser · most phones in India</p>
              <ol className="list-none">
                <Step n={1} title="Open the link in Chrome">If it opened inside WhatsApp, use <Key><MoreVertical className="w-3.5 h-3.5" /></Key> → <b className="text-bone">Open in Chrome</b> first.</Step>
                <Step n={2} title="Tap “Install GymSetu”">The install page shows a button. Chrome may also pop up its own “Install app” banner.</Step>
                <Step n={3} title="Confirm Install">A small box appears — tap Install. Nothing downloads from a store; it just adds the app.</Step>
                <Step n={4} title="Find it on your home screen">The GymSetu icon is now there, like any app. Open it and log in.</Step>
              </ol>
              <Callout tone="tip" icon={<Info className="w-4 h-4" />} tight>
                No button? Tap <Key><MoreVertical className="w-3.5 h-3.5" /></Key> → <b className="text-bone">Add to Home screen</b> / <b className="text-bone">Install app</b>. Same result.
              </Callout>
            </div>

            {/* iPhone */}
            <div id="iphone" className="glass rounded-2xl p-6 scroll-mt-24">
              <div className="flex items-center gap-3 mb-1">
                <Apple className="w-6 h-6 text-flame" />
                <span className="font-display text-xl text-bone uppercase tracking-tight">iPhone &amp; iPad</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider font-bold text-amber bg-amber/10 border border-amber/30 rounded-full px-2.5 py-1">A few taps</span>
              </div>
              <p className="font-sans text-[13px] text-ash mb-3">Safari browser · Apple has no one-tap install</p>
              <ol className="list-none">
                <Step n={1} title="Open the link in Safari">It must be <b className="text-bone">Safari</b> — “Add to Home Screen” isn’t available in Chrome on iPhone.</Step>
                <Step n={2} title={'Tap the Share button'}>The <Key><Share className="w-3.5 h-3.5" /></Key> square-with-an-arrow icon at the bottom (or top) of Safari.</Step>
                <Step n={3} title="Choose “Add to Home Screen”">Scroll the share menu down a little to find it.</Step>
                <Step n={4} title="Tap Add">GymSetu appears on your home screen. Open it and log in.</Step>
              </ol>
              <Callout tone="tip" icon={<Info className="w-4 h-4" />} tight>
                On iPhone, notifications only work <b className="text-bone">after</b> the app is added to the home screen — another reason to install rather than just bookmark.
              </Callout>
            </div>
          </div>
        </Section>

        {/* 04 — safety */}
        <Section n="04" eyebrow="The honest answer" title="Is it safe to install?">
          <p>
            Short version: <b className="text-bone">yes, and it’s actually safer than a normal app download.</b> Because GymSetu is a
            web app, your phone never installs a program that could dig into it. Here’s exactly what that means, without the sales talk.
          </p>

          <div className="mt-5">
            <Verdict tone="ok" q="Can it put a virus on my phone?">
              No. It runs inside your browser’s sandbox — the same protected space a website runs in. It can’t install other programs
              or change your phone’s settings, and because there’s no app-file to sideload, the scary “install from unknown sources”
              warning never even appears.
            </Verdict>
            <Verdict tone="ok" q="Can it read my photos, contacts, files or messages?">
              No. A web app can’t reach into your phone the way a downloaded app can. It only ever sees what you type into it. The one
              thing it may ask for is your <b className="text-bone">location</b> — and only if your gym uses GPS check-in, only when you tap to check in, and you can say no.
            </Verdict>
            <Verdict tone="ok" q="Is my gym’s data protected?">
              Every connection uses HTTPS (the padlock in your browser). Your data is stored on a secure server in <b className="text-bone">Mumbai, India</b>,
              and backed up every night. Each gym is walled off from every other — no other gym can see your members, and members can only see their own record.
            </Verdict>
            <Verdict tone="ok" q="Who else can see the data?">
              We never sell it. It’s shared only with the services needed to run GymSetu — <b className="text-bone">PayU</b> for payments,
              <b className="text-bone"> Meta</b> for WhatsApp reminders, and our AI provider when you use an AI feature. It’s all listed in the{' '}
              <Link to="/privacy" className="text-flame">Privacy Policy</Link>.
            </Verdict>
            <Verdict tone="care" q="So there’s nothing to be careful about?">
              Two normal things, same as any app. Your account is only as safe as your <b className="text-bone">password</b> — don’t share it,
              and give staff their own logins instead of yours. And when you send a member their login over WhatsApp, that message contains their password, so it’s for them only.
            </Verdict>
          </div>

          <h3 className="font-display text-xl text-bone uppercase tracking-tight mt-9 mb-1">Web app vs. downloading an APK</h3>
          <p className="font-sans text-[15px] text-ash mb-4">
            Some services hand you an Android app as a file to “download and install.” That’s the thing Android warns you about. GymSetu deliberately avoids it.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14.5px] border border-hairline rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-ink-2">
                  <th className="text-left p-3.5 font-mono text-[11px] uppercase tracking-wider text-ash font-bold"></th>
                  <th className="text-left p-3.5 font-mono text-[11px] uppercase tracking-wider text-ash font-bold">GymSetu (web app)</th>
                  <th className="text-left p-3.5 font-mono text-[11px] uppercase tracking-wider text-ash font-bold">A downloaded .apk</th>
                </tr>
              </thead>
              <tbody className="font-sans">
                {[
                  ['“Unknown sources” warning', 'Never appears', 'You must allow it'],
                  ['Access to your phone', 'Browser sandbox only', 'Can request deep access'],
                  ['Updates', 'Automatic, instantly', 'Re-download each time'],
                  ['Storage used', 'A few MB', 'Tens of MB'],
                ].map(([k, good, bad]) => (
                  <tr key={k} className="border-t border-hairline">
                    <td className="p-3.5 text-bone font-semibold">{k}</td>
                    <td className="p-3.5 text-emerald-400 font-semibold">{good}</td>
                    <td className="p-3.5 text-flame font-semibold">{bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 05 — login */}
        <Section n="05" eyebrow="Last step" title="Opening it and logging in" last>
          <p>Open GymSetu from your home screen. On the login screen you’ll choose who you are, then sign in:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              ['Gym owner', <>Log in with your <b className="text-bone">email</b> and password — the ones you set up your gym with.</>],
              ['Trainer', <>Choose <b className="text-bone">Trainer</b>, then use the <b className="text-bone">Trainer ID</b> and password your gym sent you.</>],
              ['Member', <>Choose <b className="text-bone">Member</b>, then use the <b className="text-bone">Member ID</b> and password your gym sent you.</>],
              ['Forgot the details?', <>Members and trainers: ask your gym to resend them. Owners: use the email you signed up with.</>],
            ].map(([k, v], i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-flame font-bold mb-1.5">{k}</div>
                <div className="font-sans text-[14.5px] text-bone/85 leading-relaxed">{v}</div>
              </div>
            ))}
          </div>
          <Callout tone="tip" icon={<Info className="w-4 h-4" />}>
            <b className="text-bone">You’re the one who invites people.</b> As the owner, when you add a member or trainer, GymSetu prepares
            a ready-made WhatsApp message with their login and this install link — you just tap send. They install the same way you did.
          </Callout>

          <a href={`${APP_URL}/install`} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2.5 mt-8 bg-heat text-black px-6 py-3.5 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:gap-3.5 transition-all">
            Go to the install page <ArrowRight className="w-4 h-4" />
          </a>
        </Section>

        <p className="font-sans text-[13.5px] text-ash/70 text-center mt-14 leading-relaxed">
          Need a hand? Message the gym that invited you, or write to{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ash hover:text-bone underline underline-offset-2">{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </main>
  );
};

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ n, eyebrow, title, last, children }: {
  n: string; eyebrow: string; title: string; last?: boolean; children: React.ReactNode;
}) => (
  <section className={`py-11 ${last ? '' : 'border-b border-hairline'} scroll-mt-16`}>
    <div className="flex items-baseline gap-3.5 mb-5">
      <span className="font-mono text-[15px] font-bold text-flame tabular-nums tracking-wide pt-1">{n}</span>
      <div>
        <div className={EYEBROW}>{eyebrow}</div>
        <h2 className="font-display text-3xl md:text-4xl text-bone uppercase tracking-tight mt-1">{title}</h2>
      </div>
    </div>
    <div className="[&>p]:font-sans [&>p]:text-[15.5px] [&>p]:text-bone/80 [&>p]:leading-relaxed [&>p]:mb-3.5 [&>p]:max-w-[66ch] [&>p:last-child]:mb-0">
      {children}
    </div>
  </section>
);

// ── Callout ──────────────────────────────────────────────────────────────────
const Callout = ({ tone, icon, tight, children }: {
  tone: 'warn' | 'tip'; icon: React.ReactNode; tight?: boolean; children: React.ReactNode;
}) => {
  const box = tone === 'warn'
    ? 'border-flame/30 bg-flame/[0.08]'
    : 'border-hairline bg-white/[0.02]';
  const mk = tone === 'warn' ? 'bg-flame text-black' : 'bg-sky-500 text-white';
  return (
    <div className={`flex gap-3.5 rounded-2xl border p-4 ${box} ${tight ? 'mt-4' : 'my-5'}`}>
      <span className={`flex-none w-7 h-7 rounded-lg grid place-items-center ${mk}`}>{icon}</span>
      <p className="font-sans text-[14.5px] text-bone/85 leading-relaxed self-center !max-w-none !mb-0">{children}</p>
    </div>
  );
};
