import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

export const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txnid  = searchParams.get('txnid')  ?? '';
  const reason = searchParams.get('reason') ?? 'failed';
  const msg    = searchParams.get('msg')    ?? '';

  useEffect(() => {
    document.title = 'Payment Failed | GymSetu';
    trackEvent('payment_failure', { txnid, reason });
  }, [txnid, reason]);

  return (
    <main className="relative bg-ink min-h-screen flex items-center justify-center px-4 pt-28 pb-20 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500 grid place-items-center mx-auto mb-8">
          <X className="w-8 h-8 text-black" strokeWidth={3} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-bone uppercase mb-4 leading-[0.95]">
          Payment <span className="text-red-500">failed</span>
        </h1>
        <p className="font-sans text-ash text-base mb-2 leading-relaxed">
          We couldn't confirm your payment. No money has been charged — or if it was, it'll be auto-refunded within 5–7 business days.
        </p>
        {msg && (
          <p className="font-mono text-[10px] text-ash uppercase font-bold mt-4 mb-2">Reason: {msg}</p>
        )}
        {txnid && (
          <p className="font-mono text-[10px] text-ash mt-1 mb-8">
            Txn ID: <span className="text-flame">{txnid}</span>
          </p>
        )}

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={() => navigate('/signup/plan', { replace: true })}
            className="bg-heat text-black py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:opacity-90"
          >
            Choose a plan again →
          </button>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="font-mono text-[10px] text-ash uppercase font-bold tracking-wider hover:text-flame transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </main>
  );
};
