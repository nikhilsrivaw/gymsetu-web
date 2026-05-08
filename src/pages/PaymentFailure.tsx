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
    <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-500 flex items-center justify-center mx-auto mb-8">
          <X className="w-8 h-8 text-black" strokeWidth={3} />
        </div>
        <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-4 leading-tight tracking-tighter">
          PAYMENT<br /><span className="text-red-500">FAILED.</span>
        </h1>
        <p className="font-sans text-white/60 text-base mb-2 leading-relaxed">
          We couldn't confirm your payment. No money has been charged — or if it was, it'll be auto-refunded within 5–7 business days.
        </p>
        {msg && (
          <p className="font-mono text-[10px] text-white/40 uppercase font-bold mt-4 mb-2">
            REASON: {msg}
          </p>
        )}
        {txnid && (
          <p className="font-mono text-[10px] text-white/30 mt-1 mb-8">
            TXN ID: <span className="text-brand-orange">{txnid}</span>
          </p>
        )}

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={() => navigate('/signup/plan', { replace: true })}
            className="bg-brand-orange text-black py-3 font-archivo text-base uppercase tracking-tighter hover:opacity-90"
          >
            CHOOSE A PLAN AGAIN →
          </button>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="font-mono text-[10px] text-white/30 uppercase font-bold hover:text-brand-orange transition-colors"
          >
            GO TO DASHBOARD
          </button>
        </div>
      </div>
    </main>
  );
};
