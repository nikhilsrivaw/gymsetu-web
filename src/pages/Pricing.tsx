import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { WaitlistForm } from '../components/WaitlistForm';
import { useToast } from '../context/ToastContext';
import { RAZORPAY_BASIC_PAISE } from '../lib/constants';
import { trackEvent } from '../lib/analytics';

declare global {
  interface Window { Razorpay: any; }
}

const plans = [
  {
    id: 'basic' as const,
    name: 'BASIC',
    price: '₹999',
    period: '/MONTH',
    features: [
      { text: 'Member management',      included: true  },
      { text: 'Attendance & payments',  included: true  },
      { text: 'Reports & analytics',    included: true  },
      { text: 'Trainer management',     included: true  },
      { text: '+₹100 per extra branch', included: true  },
      { text: 'AI features',            included: false },
      { text: 'WhatsApp automation',    included: false },
      { text: '7-day free trial',       included: false },
    ],
    cta: 'GET STARTED',
    recommended: false,
  },
  {
    id: 'pro' as const,
    name: 'PRO',
    price: '₹1,699',
    period: '/MONTH',
    features: [
      { text: 'Everything in Basic',        included: true },
      { text: 'AI Insights & Reports',      included: true },
      { text: 'WhatsApp Automation',        included: true },
      { text: 'Revenue Forecast',           included: true },
      { text: 'Churn Early Warning',        included: true },
      { text: 'AI Diet & Workout Plans',    included: true },
      { text: '+₹400 per extra branch',     included: true },
      { text: '7-day free trial included',  included: true },
    ],
    cta: 'START FREE TRIAL',
    recommended: true,
  },
];

export const Pricing = () => {
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<'basic' | 'pro' | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Pricing | GymSetu';
  }, []);

  // Load Razorpay SDK once on mount
  useEffect(() => {
    if (document.getElementById('rzp-sdk')) return;
    const script = document.createElement('script');
    script.id = 'rzp-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }, []);

  const openRazorpay = (ownerName: string, gymName: string, phone: string) => {
    if (typeof window.Razorpay === 'undefined') {
      toast('Payment gateway is still loading — please try again in a moment.', 'error');
      return;
    }

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: RAZORPAY_BASIC_PAISE,
      currency: 'INR',
      name: 'GymSetu',
      description: 'Basic Plan — Monthly Subscription',
      prefill: { name: ownerName, contact: phone },
      notes: { gym_name: gymName, plan: 'basic' },
      theme: { color: '#FF4D00' },
      handler: (_response: { razorpay_payment_id: string }) => {
        // In production: verify + activate subscription via Edge Function + Razorpay webhook
        trackEvent('purchase', { plan: 'basic', value: 999 });
        setActiveModal(null);
        setPaymentSuccess(true);
      },
    });
    rzp.open();
  };

  return (
    <main className="bg-near-black pt-32 md:pt-48 pb-24 md:pb-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-archivo text-6xl sm:text-7xl md:text-[10vw] text-white uppercase leading-none mb-16 md:mb-24 tracking-tighter">
          SIMPLE, <span className="text-brand-orange">HONEST</span><br />PRICING.
        </h1>

        {paymentSuccess && (
          <div
            role="alert"
            className="mb-12 border-2 border-brand-orange bg-brand-orange/10 p-6 text-center"
          >
            <p className="font-archivo text-2xl text-brand-orange uppercase">PAYMENT SUCCESSFUL!</p>
            <p className="font-mono text-xs text-white/60 uppercase mt-2 font-bold">
              Welcome to GymSetu Basic. We'll WhatsApp you with your login details shortly.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative border-2 p-8 md:p-12 flex flex-col ${
                plan.recommended
                  ? 'border-brand-orange bg-brand-orange text-black'
                  : 'border-white/20 text-white'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-black text-white px-4 md:px-6 py-2 font-mono text-[10px] md:text-xs font-bold uppercase -translate-y-1/2 translate-x-2 md:translate-x-4">
                  RECOMMENDED
                </div>
              )}

              <h2 className="font-archivo text-4xl md:text-5xl mb-4">{plan.name}</h2>
              <div className="flex items-baseline gap-2 mb-8 md:mb-12">
                <span className="font-archivo text-6xl md:text-7xl">{plan.price}</span>
                <span className="font-mono text-xs md:text-sm font-bold opacity-60">{plan.period}</span>
              </div>

              <ul className="flex flex-col gap-4 md:gap-6 mb-8 md:mb-12 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 md:gap-4">
                    {feature.included ? (
                      <Check
                        className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${plan.recommended ? 'text-black' : 'text-brand-orange'}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <X className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 opacity-20" aria-hidden="true" />
                    )}
                    <span className={`font-mono text-xs md:text-sm font-bold uppercase ${!feature.included && 'opacity-20'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  trackEvent('cta_click', { plan: plan.id, page: 'pricing' });
                  setActiveModal(plan.id);
                }}
                className={`w-full py-4 md:py-6 font-archivo text-xl md:text-2xl uppercase tracking-tighter transition-transform hover:scale-105 ${
                  plan.recommended ? 'bg-black text-white' : 'bg-brand-orange text-black'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* WhatsApp Top-up Packs */}
        <div className="mt-24 md:mt-32 border-2 border-white/20 p-8 md:p-12">
          <h3 className="font-archivo text-3xl md:text-4xl text-white uppercase mb-8 md:mb-12">
            WHATSAPP TOP-UP PACKS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: 'STARTER',  msgs: '100 MESSAGES', price: '₹79'  },
              { name: 'STANDARD', msgs: '300 MESSAGES', price: '₹179' },
              { name: 'BULK',     msgs: '700 MESSAGES', price: '₹349' },
            ].map(pack => (
              <div key={pack.name} className="border border-white/20 p-6 md:p-8 text-center hover:border-brand-orange transition-colors">
                <div className="font-mono text-[10px] text-brand-orange mb-2 font-bold">{pack.name}</div>
                <div className="font-archivo text-2xl md:text-3xl text-white mb-4">{pack.msgs}</div>
                <div className="font-archivo text-xl md:text-2xl text-brand-orange">{pack.price}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] md:text-sm text-white/40 uppercase font-bold">
          NOT HAPPY IN YOUR FIRST 7 DAYS? WE'LL REFUND YOU. NO QUESTIONS.
        </p>
      </div>

      {activeModal === 'pro' && (
        <WaitlistForm plan="pro" onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'basic' && (
        <WaitlistForm
          plan="basic"
          onClose={() => setActiveModal(null)}
          onReadyForPayment={({ owner_name, gym_name, phone }) => {
            setActiveModal(null);
            openRazorpay(owner_name, gym_name, phone);
          }}
        />
      )}
    </main>
  );
};
