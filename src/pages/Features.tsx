import React from 'react';
import { Users, IndianRupee, CheckCircle2, BarChart3, Brain, MessageSquare, Dumbbell, Map, Utensils, TrendingDown, LineChart, FileText } from 'lucide-react';

const featureCategories = [
  {
    title: "OPERATIONS",
    features: [
      { icon: <Users />, title: "Member Management", desc: "Add members, track plans, view history, manage profiles" },
      { icon: <CheckCircle2 />, title: "Attendance Tracking", desc: "Daily check-ins with one tap. View monthly reports" },
      { icon: <Dumbbell />, title: "Trainer Management", desc: "Add trainers, assign clients, track performance" },
      { icon: <Map />, title: "Multi-Branch Support", desc: "Manage all your gym locations from one account" },
    ]
  },
  {
    title: "FINANCIAL",
    features: [
      { icon: <IndianRupee />, title: "Payments & Receipts", desc: "Record fees, UPI, cash. Auto-generate receipts" },
      { icon: <FileText />, title: "GST Invoices", desc: "Auto-generate GST-compliant invoices. Export for CA" },
      { icon: <LineChart />, title: "Revenue Forecast", desc: "Predict next 3 months of income with confidence" },
    ]
  },
  {
    title: "AI & AUTOMATION",
    features: [
      { icon: <MessageSquare />, title: "WhatsApp Automation", desc: "Auto-send renewal reminders, payment confirmations" },
      { icon: <Brain />, title: "AI Insights", desc: "AI-powered revenue forecasts, churn detection, growth tips" },
      { icon: <Utensils />, title: "Diet & Workout Plans", desc: "AI-generated plans for members based on their goals" },
      { icon: <TrendingDown />, title: "Churn Early Warning", desc: "Know which members are about to leave before they do" },
      { icon: <BarChart3 />, title: "Advanced Analytics", desc: "Revenue charts, member growth, attendance trends" },
    ]
  }
];

export const Features = () => {
  return (
    <main className="relative bg-ink pt-32 md:pt-44 pb-24 md:pb-32 px-4 md:px-6 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 540, height: 540, top: -160, left: '20%', background: 'radial-gradient(circle,#FF4D0030,transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <p className="font-mono text-[11px] text-ash uppercase tracking-[0.25em] mb-4">Features</p>
        <h1 className="font-display text-6xl sm:text-7xl md:text-[8vw] text-bone uppercase leading-[0.85] mb-16 md:mb-24 tracking-tight">
          Everything <span className="text-heat">unlocked</span>
        </h1>

        <div className="flex flex-col gap-16 md:gap-24">
          {featureCategories.map((cat, ci) => (
            <div key={cat.title}>
              <div className="flex items-center gap-3 mb-8 md:mb-10">
                <span className="font-mono text-flame text-xs font-bold tracking-[0.2em]">
                  {String(ci + 1).padStart(2, '0')}
                </span>
                <h2 className="font-mono text-bone text-sm md:text-base font-bold tracking-[0.2em] uppercase">
                  {cat.title}
                </h2>
                <div className="flex-1 h-px bg-hairline" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {cat.features.map((feature, i) => (
                  <div key={i} className="glass rounded-2xl p-7 md:p-8 hover:border-flame/40 transition-all group">
                    <div className="text-flame w-9 h-9 md:w-10 md:h-10 mb-6 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="font-display text-xl md:text-2xl text-bone uppercase mb-3">{feature.title}</h3>
                    <p className="font-sans text-ash text-sm md:text-base leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
