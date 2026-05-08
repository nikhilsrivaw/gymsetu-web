import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Features } from './pages/Features';
import { Contact } from './pages/Contact';
import { Signup } from './pages/Signup';
import { SignupPlan } from './pages/SignupPlan';
import { SignupSetup } from './pages/SignupSetup';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { AuthCallback } from './pages/AuthCallback';
import { Admin } from './pages/Admin';
import { Branches } from './pages/Branches';
import { Tokens } from './pages/Tokens';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { trackEvent } from './lib/analytics';

// Franchise portal
import { FranchiseLayout } from './franchise/components/FranchiseLayout';
import { FranchiseLanding } from './franchise/pages/FranchiseLanding';
import { FranchiseReadiness } from './franchise/pages/FranchiseReadiness';
import { FranchiseSetup } from './franchise/pages/FranchiseSetup';
import { FranchiseDashboard } from './franchise/pages/FranchiseDashboard';
import { FranchiseLocations } from './franchise/pages/FranchiseLocations';
import { FranchiseInvites } from './franchise/pages/FranchiseInvites';
import { FranchiseRoyalties } from './franchise/pages/FranchiseRoyalties';
import { FranchiseSOPs } from './franchise/pages/FranchiseSOPs';
import { FranchiseSettings } from './franchise/pages/FranchiseSettings';
import { AcceptInvite } from './franchise/pages/AcceptInvite';
import { FranchisePricing } from './franchise/pages/FranchisePricing';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Pages without marketing footer / WhatsApp widget
const NO_FOOTER_PATHS  = new Set(['/signup', '/signup/plan', '/signup/setup', '/login', '/dashboard', '/admin', '/auth/callback', '/branches', '/tokens', '/payment/success', '/payment/failure']);
const NO_WIDGET_PATHS  = new Set(['/dashboard', '/signup/plan', '/signup/setup', '/auth/callback', '/payment/success', '/payment/failure']);

// Franchise portal has its own layout — hide main Navbar/Footer entirely
const isFranchisePath = (p: string) => p.startsWith('/franchise/') || p === '/franchise' || p.startsWith('/accept-invite/');

function GA4Init() {
  useEffect(() => {
    if (!gaMeasurementId || gaMeasurementId === 'G-XXXXXXXXXX') return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) { window.dataLayer.push(args); };
    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId);
  }, []);
  return null;
}

function PageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('page_view', { page_path: pathname });
  }, [pathname]);
  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const franchise = isFranchisePath(pathname);
  const showFooter = !franchise && !NO_FOOTER_PATHS.has(pathname);
  const showWidget = !franchise && !NO_WIDGET_PATHS.has(pathname);

  return (
    <div className="min-h-screen flex flex-col selection:bg-black selection:text-brand-orange">
      {!franchise && <Navbar />}
      <div className="flex-grow">
        <Routes>
          {/* Main site routes */}
          <Route path="/"          element={<Home />} />
          <Route path="/pricing"   element={<Pricing />} />
          <Route path="/features"  element={<Features />} />
          <Route path="/contact"   element={<Contact />} />
          <Route path="/signup"        element={<Signup />} />
          <Route path="/signup/plan"   element={<SignupPlan />} />
          <Route path="/signup/setup"  element={<SignupSetup />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/branches"      element={<ProtectedRoute><Branches /></ProtectedRoute>} />
          <Route path="/tokens"        element={<ProtectedRoute><Tokens /></ProtectedRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin"         element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />

          {/* Franchise portal — public pages (own layout) */}
          <Route path="/franchise" element={<FranchiseLanding />} />
          <Route path="/franchise/pricing" element={<FranchisePricing />} />
          <Route path="/franchise/readiness" element={<FranchiseReadiness />} />
          <Route path="/franchise/setup" element={<FranchiseSetup />} />

          {/* Franchise portal — protected pages (with sidebar layout) */}
          <Route path="/franchise/dashboard" element={<FranchiseLayout><FranchiseDashboard /></FranchiseLayout>} />
          <Route path="/franchise/locations" element={<FranchiseLayout><FranchiseLocations /></FranchiseLayout>} />
          <Route path="/franchise/invites"   element={<FranchiseLayout><FranchiseInvites /></FranchiseLayout>} />
          <Route path="/franchise/royalties" element={<FranchiseLayout><FranchiseRoyalties /></FranchiseLayout>} />
          <Route path="/franchise/sops"      element={<FranchiseLayout><FranchiseSOPs /></FranchiseLayout>} />
          <Route path="/franchise/settings"  element={<FranchiseLayout><FranchiseSettings /></FranchiseLayout>} />

          {/* Accept invite (standalone, no sidebar) */}
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          <Route path="*"              element={<NotFound />} />
        </Routes>
      </div>

      {showFooter && <Footer />}

      {showWidget && (
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('whatsapp_click', { source: 'floating_widget' })}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
          aria-label="Chat with us on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-8 md:h-8 fill-current" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <GA4Init />
            <PageTracker />
            <AppShell />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
