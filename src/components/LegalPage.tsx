import React, { useEffect } from 'react';

/**
 * Shared shell for /privacy, /terms and /refund.
 *
 * These pages exist for three reasons, in order of urgency:
 *  1. PayU/Razorpay require published terms, privacy and cancellation/refund
 *     policies on the merchant site as an onboarding condition.
 *  2. Google Play requires a privacy policy URL before a listing can go live.
 *  3. India's DPDP Act 2023 expects a notice describing what you collect and why.
 *
 * Keep them boring and true. A policy that overclaims ("bank-grade encryption",
 * "fully GDPR compliant") is worse than none: it's a promise you can be held to.
 */

export const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display text-2xl md:text-3xl uppercase text-bone mb-4 tracking-tight">{title}</h2>
    <div className="flex flex-col gap-4 font-sans text-base text-bone/75 leading-relaxed">{children}</div>
  </section>
);

export const LegalPage = ({
  kicker, title, highlight, updated, children,
}: {
  kicker: string; title: string; highlight: string; updated: string; children: React.ReactNode;
}) => {
  useEffect(() => {
    document.title = `${kicker} | GymSetu`;
  }, [kicker]);

  return (
    <main className="relative bg-ink pt-32 md:pt-44 pb-24 md:pb-32 px-4 md:px-6 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div
        className="glow-orb animate-float-glow"
        aria-hidden="true"
        style={{ width: 520, height: 520, top: -140, right: -80, background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }}
      />

      <div className="relative max-w-4xl mx-auto">
        <p className="font-mono text-[11px] text-ash uppercase tracking-[0.25em] mb-4">{kicker}</p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-bone uppercase leading-[0.85] mb-6 tracking-tight">
          {title} <span className="text-heat">{highlight}</span>
        </h1>
        <p className="font-mono text-[11px] text-ash uppercase tracking-[0.2em] mb-14">Last updated: {updated}</p>

        <div className="glass rounded-2xl p-7 md:p-12">{children}</div>
      </div>
    </main>
  );
};
