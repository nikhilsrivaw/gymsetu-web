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
    <main className="bg-near-black pt-32 md:pt-48 pb-24 md:pb-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-archivo text-6xl sm:text-7xl md:text-[10vw] text-white uppercase leading-none mb-16 md:mb-24 tracking-tighter">
          WE'RE <span className="text-brand-orange">HERE</span><br />TO HELP.
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
          <div className="flex flex-col gap-8 md:gap-12">
            <div className="border-2 border-brand-orange p-8 md:p-12 bg-brand-orange text-black">
              <MessageSquare className="w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8" aria-hidden="true" />
              <h2 className="font-archivo text-4xl md:text-5xl mb-4 uppercase">WHATSAPP SUPPORT</h2>
              <p className="font-sans text-lg md:text-xl mb-8">Get instant help from our team via WhatsApp chat.</p>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('whatsapp_click', { source: 'contact_page' })}
                className="bg-black text-white px-6 md:px-8 py-3 md:py-4 font-archivo text-lg md:text-xl uppercase tracking-tighter flex items-center gap-4 hover:translate-x-4 transition-transform w-fit"
              >
                CHAT NOW <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>

            <div className="border-2 border-white/20 p-8 md:p-12 text-white">
              <Mail className="w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8 text-brand-orange" aria-hidden="true" />
              <h2 className="font-archivo text-4xl md:text-5xl mb-4 uppercase">EMAIL US</h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-sans text-lg md:text-xl mb-4 text-brand-orange break-all hover:underline block"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="font-sans text-base md:text-lg opacity-40">For general inquiries and partnership requests.</p>
            </div>

            <div className="border-2 border-white/20 p-8 md:p-12 text-white">
              <Clock className="w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8 text-brand-orange" aria-hidden="true" />
              <h2 className="font-archivo text-4xl md:text-5xl mb-8 uppercase">RESPONSE TIME</h2>
              <div className="flex flex-col gap-6 md:gap-8">
                <div>
                  <div className="font-mono text-[10px] text-brand-orange font-bold mb-2 uppercase">WEEKDAYS</div>
                  <div className="font-archivo text-3xl md:text-4xl uppercase">WITHIN 4 HOURS</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-brand-orange font-bold mb-2 uppercase">WEEKENDS</div>
                  <div className="font-archivo text-3xl md:text-4xl uppercase">WITHIN 12 HOURS</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-12">
            <ContactForm />
          </div>
        </div>

        <div className="mt-24 md:mt-32 p-8 md:p-12 border-2 border-white/10">
          <h3 className="font-archivo text-3xl md:text-4xl text-white uppercase mb-4 text-center">
            FREQUENTLY ASKED QUESTIONS
          </h3>
          <p className="font-mono text-brand-orange font-bold uppercase mb-12 text-xs md:text-base text-center">
            HAVE A QUICK QUESTION?
          </p>
          <div className="max-w-3xl mx-auto flex flex-col gap-6 md:gap-8 text-left">
            {[
              { q: 'Do I need to be tech-savvy to use GymSetu?',       a: 'If you can use WhatsApp, you can use GymSetu. Setup takes under 10 minutes.' },
              { q: 'What happens after the 7-day free trial?',          a: 'You\'re automatically moved to the Pro plan at ₹1,699/month. You can cancel anytime before the trial ends.' },
              { q: 'Is my data safe?',                                  a: 'Yes. All data is encrypted and stored on secure servers. We never share your data.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-white/10 pb-6 md:pb-8">
                <h4 className="font-archivo text-xl md:text-2xl text-white uppercase mb-4">{faq.q}</h4>
                <p className="font-sans text-white/60 text-base md:text-lg">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
