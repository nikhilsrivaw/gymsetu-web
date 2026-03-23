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
    <main className="bg-near-black pt-32 md:pt-48 pb-24 md:pb-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-archivo text-6xl sm:text-7xl md:text-[10vw] text-white uppercase leading-none mb-16 md:mb-24 tracking-tighter">
          EVERYTHING <span className="text-brand-orange">UNLOCKED.</span>
        </h1>

        <div className="flex flex-col gap-20 md:gap-32">
          {featureCategories.map((cat) => (
            <div key={cat.title}>
              <h2 className="font-mono text-brand-orange text-lg md:text-xl font-bold mb-8 md:mb-12 tracking-widest border-b-2 border-brand-orange pb-2 md:pb-4 inline-block">
                {cat.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {cat.features.map((feature, i) => (
                  <div key={i} className="border-2 border-white/10 p-8 md:p-10 hover:border-brand-orange transition-all group">
                    <div className="text-brand-orange w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="font-archivo text-2xl md:text-3xl text-white uppercase mb-4">{feature.title}</h3>
                    <p className="font-sans text-white/60 text-base md:text-lg leading-relaxed">{feature.desc}</p>
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
