import React, { useEffect } from 'react';
import { MessageSquare, Mail, Clock, ArrowRight } from 'lucide-react';
import { ContactForm } from '../components/ContactForm';
import { SUPPORT_EMAIL } from '../lib/constants';
import { trackEvent } from '../lib/analytics';

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

export const Contact = () => {
  useEffect(() => {
    document.title = 'Contact & Support | GymSetu';
  }, []);

  return (
    <main className="relative bg-ink pt-32 md:pt-44 pb-24 md:pb-32 px-4 md:px-6 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 520, height: 520, top: -140, right: -80, background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <p className="font-mono text-[11px] text-ash uppercase tracking-[0.25em] mb-4">Contact & support</p>
        <h1 className="font-display text-6xl sm:text-7xl md:text-[8vw] text-bone uppercase leading-[0.85] mb-16 md:mb-20 tracking-tight">
          We're <span className="text-heat">here</span><br />to help
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="bg-heat text-black rounded-2xl p-8 md:p-10">
              <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mb-6" aria-hidden="true" />
              <h2 className="font-display text-3xl md:text-4xl mb-3 uppercase">WhatsApp support</h2>
              <p className="font-sans text-base md:text-lg mb-8 text-black/80">Get instant help from our team via WhatsApp chat.</p>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackEvent('whatsapp_click', { source: 'contact_page' })}
                className="bg-black text-bone px-6 py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider flex items-center gap-3 hover:gap-5 transition-all w-fit"
              >
                Chat now <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="glass rounded-2xl p-8 md:p-10">
              <Mail className="w-10 h-10 md:w-12 md:h-12 mb-6 text-flame" aria-hidden="true" />
              <h2 className="font-display text-3xl md:text-4xl mb-3 uppercase text-bone">Email us</h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-sans text-lg mb-3 text-flame break-all hover:underline block"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="font-sans text-base text-ash">For general inquiries and partnership requests.</p>
            </div>

            <div className="glass rounded-2xl p-8 md:p-10">
              <Clock className="w-10 h-10 md:w-12 md:h-12 mb-6 text-flame" aria-hidden="true" />
              <h2 className="font-display text-3xl md:text-4xl mb-6 uppercase text-bone">Response time</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <div className="font-mono text-[10px] text-flame font-bold mb-2 uppercase tracking-wider">Weekdays</div>
                  <div className="font-display text-2xl md:text-3xl uppercase text-bone">Within 4 hours</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-flame font-bold mb-2 uppercase tracking-wider">Weekends</div>
                  <div className="font-display text-2xl md:text-3xl uppercase text-bone">Within 12 hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-12">
            <ContactForm />
          </div>
        </div>

        <div className="mt-20 md:mt-28 p-8 md:p-12 glass rounded-2xl">
          <p className="font-mono text-flame font-bold uppercase mb-3 text-xs text-center tracking-widest">Have a quick question?</p>
          <h3 className="font-display text-3xl md:text-4xl text-bone uppercase mb-12 text-center">
            Frequently asked questions
          </h3>
          <div className="max-w-3xl mx-auto flex flex-col gap-6 md:gap-8 text-left">
            {[
              { q: 'Do I need to be tech-savvy to use GymSetu?',       a: 'If you can use WhatsApp, you can use GymSetu. Setup takes under 10 minutes.' },
              { q: 'What happens after the 7-day free trial?',          a: 'You\'re automatically moved to the Pro plan at ₹1,699/month. You can cancel anytime before the trial ends.' },
              { q: 'Is my data safe?',                                  a: 'Yes. All data is encrypted and stored on secure servers. We never share your data.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-hairline pb-6 md:pb-8">
                <h4 className="font-display text-xl md:text-2xl text-bone uppercase mb-3">{faq.q}</h4>
                <p className="font-sans text-ash text-base md:text-lg">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
