import React, { useEffect, useState } from 'react';
import { RotatingScrollIndicator } from '../components/RotatingScrollIndicator';
import { ServiceListItem } from '../components/ServiceListItem';
import { WaitlistForm } from '../components/WaitlistForm';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { IndianRupee, Phone, BarChart3, Brain, MessageSquare, Dumbbell, Map, Utensils, TrendingDown, LineChart, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { trackEvent } from '../lib/analytics';

export const Home = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    document.title = 'GymSetu — Gym Management App for Indian Gyms';
  }, []);

  return (
    <main className="bg-brand-orange overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-12 px-6">
        <h1 className="font-archivo text-7xl sm:text-8xl md:text-[16vw] leading-[0.85] text-black text-center uppercase tracking-[-0.04em]">
          GYMSETU
        </h1>

        <div className="w-full mt-12 border-t-2 border-black pt-8 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="max-w-xs">
            <p className="font-mono text-[10px] md:text-xs uppercase font-bold text-black">
              BASED IN INDIA. BUILT FOR THE MODERN GYM OWNER.
            </p>
          </div>
          <div className="block">
            <RotatingScrollIndicator />
          </div>
          <div className="md:text-right">
            <p className="font-archivo text-xl md:text-2xl text-black uppercase leading-tight">
              THE COMPLETE<br className="hidden md:block" /> GYM OS
            </p>
          </div>
        </div>

        {/* Hero CTAs */}
        <div className="w-full mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              trackEvent('cta_click', { label: 'hero_free_trial', page: 'home' });
              setShowWaitlist(true);
            }}
            className="bg-black text-white px-8 py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity"
          >
            START FREE TRIAL →
          </motion.button>
          <AppStoreBadges />
        </div>
      </section>

      {/* Skewed Marquee */}
      <section className="bg-black py-12 md:py-24 -rotate-2 scale-110 overflow-hidden border-y-2 border-black" aria-hidden="true">
        <div className="flex flex-col gap-2 md:gap-4 rotate-2">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="font-archivo text-[12vw] md:text-[10vw] text-brand-orange uppercase mx-4 md:mx-8">
                MANAGE SMARTER • GROW FASTER •
              </span>
            ))}
          </div>
          <div className="flex whitespace-nowrap animate-marquee-reverse opacity-80">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="font-archivo text-[12vw] md:text-[10vw] text-white uppercase mx-4 md:mx-8">
                NO SPREADSHEETS • NO CHAOS •
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-brand-orange py-16 md:py-24 px-6 border-b-2 border-black">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-center text-black font-bold uppercase mb-12 text-xs md:text-base">
            TRUSTED BY GYM OWNERS ACROSS INDIA
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { val: '500+',    label: 'GYMS'             },
              { val: '50,000+', label: 'MEMBERS MANAGED'  },
              { val: '4.9 ★',  label: 'APP RATING'       },
            ].map(stat => (
              <div key={stat.label} className="text-center border-2 border-black p-6 md:p-8">
                <div className="font-archivo text-5xl md:text-6xl text-black">{stat.val}</div>
                <div className="font-mono text-[10px] md:text-sm font-bold text-black mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-near-black py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-archivo text-5xl sm:text-6xl md:text-8xl text-white uppercase mb-16 md:mb-24 leading-none tracking-tighter">
            RUNNING A GYM IS HARD.<br />
            <span className="text-brand-orange">IT SHOULDN'T BE.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: <IndianRupee aria-hidden="true" />, title: 'PAYMENTS', quote: 'I track fees in a notebook. I forget who hasn\'t paid. I lose money every month.' },
              { icon: <Phone aria-hidden="true" />,       title: 'WHATSAPP', quote: 'I manually remind 200 members about renewals on WhatsApp. It takes hours every week.' },
              { icon: <BarChart3 aria-hidden="true" />,   title: 'REPORTS',  quote: 'I have no idea if my gym is actually profitable or which members are about to leave.' },
            ].map((item, i) => (
              <div key={i} className="border-2 border-white/20 p-6 md:p-8 flex flex-col gap-4 md:gap-6 hover:border-brand-orange transition-colors">
                <div className="text-brand-orange w-10 h-10 md:w-12 md:h-12">{item.icon}</div>
                <h3 className="font-archivo text-xl md:text-2xl text-white uppercase">{item.title}</h3>
                <p className="font-sans text-white/60 italic text-base md:text-lg">"{item.quote}"</p>
              </div>
            ))}
          </div>
          <div className="mt-16 md:mt-24 text-center">
            <p className="font-archivo text-2xl md:text-4xl text-white uppercase">GYMSETU FIXES ALL OF THIS.</p>
            <p className="font-mono text-brand-orange mt-4 uppercase font-bold text-xs md:text-base">ONE APP. EVERY PROBLEM SOLVED.</p>
          </div>
        </div>
      </section>

      {/* Service List */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="px-6 mb-16 md:mb-24">
          <h2 className="font-archivo text-5xl sm:text-6xl md:text-8xl uppercase leading-none tracking-tighter">
            EVERYTHING YOU<br />NEED IN <span className="text-brand-orange">ONE PLACE</span>
          </h2>
        </div>
        <div className="flex flex-col">
          <ServiceListItem index="01" title="MEMBER MANAGEMENT"  tags={['PROFILES', 'HISTORY', 'PLANS']} />
          <ServiceListItem index="02" title="WHATSAPP AUTOMATION" tags={['REMINDERS', 'RENEWALS', 'AI']} />
          <ServiceListItem index="03" title="PAYMENTS & GST"     tags={['UPI', 'CASH', 'INVOICES']} />
          <ServiceListItem index="04" title="AI INSIGHTS"        tags={['CHURN', 'FORECAST', 'GROWTH']} />
        </div>
      </section>

      {/* WhatsApp Highlight */}
      <section className="bg-brand-orange py-24 md:py-32 px-6 border-y-2 border-black overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="font-archivo text-5xl md:text-7xl text-black uppercase leading-[0.9] mb-8">
              STOP MANUALLY<br />MESSAGING 200<br />MEMBERS.
            </h2>
            <p className="font-sans text-black text-lg md:text-xl mb-12 max-w-md">
              GymSetu's Pro plan sends automated WhatsApp messages so you never have to.
              Renewal reminders, payment confirmations — all automated.
            </p>
            <div className="bg-black text-white p-6 md:p-8 inline-block">
              <div className="font-archivo text-4xl md:text-5xl mb-2">35% FEWER</div>
              <div className="font-mono text-[10px] md:text-xs uppercase font-bold">EXPIRED MEMBERSHIPS EVERY MONTH</div>
            </div>
          </div>
          <div className="flex flex-col gap-4" aria-label="Automated WhatsApp message sequence">
            {[
              { day: 'DAY -7', msg: 'Your membership expires in 7 days. Renew now →' },
              { day: 'DAY -3', msg: 'Special offer: Renew before expiry and save ₹200' },
              { day: 'DAY 0',  msg: 'Your membership has expired. Book your renewal →' },
              { day: 'DAY +3', msg: 'We miss you! Come back with an exclusive offer' },
            ].map((step, i) => (
              <div key={i} className="bg-white border-2 border-black p-4 md:p-6 translate-x-2 md:translate-x-4 hover:translate-x-6 md:hover:translate-x-8 transition-transform">
                <div className="font-mono text-[10px] md:text-xs font-bold text-brand-orange mb-2">{step.day}</div>
                <div className="font-sans text-black font-medium text-sm md:text-base">{step.msg}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="bg-near-black py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-16 md:mb-24 text-center">
            ONE APP. THREE PORTALS.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { title: 'GYM OWNER', desc: 'Full control. Member management, payments, reports, AI insights, WhatsApp automation.' },
              { title: 'MEMBER',    desc: 'Fitness companion. View plan, log workouts, track progress, get AI diet plans.' },
              { title: 'TRAINER',   desc: 'Manage clients. Build workout plans, track client progress, manage schedule.' },
            ].map((portal, i) => (
              <div key={i} className="border-2 border-white/20 p-8 md:p-12 text-center hover:bg-brand-orange hover:border-black hover:text-black transition-all group">
                <h3 className="font-archivo text-3xl md:text-4xl mb-6">{portal.title}</h3>
                <p className="font-sans text-sm md:text-base opacity-60 group-hover:opacity-100">{portal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showWaitlist && (
        <WaitlistForm plan="pro" onClose={() => setShowWaitlist(false)} />
      )}
    </main>
  );
};
