import React, { Suspense, lazy } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SiteContentProvider } from './context/SiteContentContext';
import { AuthProvider } from './context/AuthContext';
import { CybersecurityProvider, useCybersecurity } from './context/CybersecurityContext';
import { SorteoProvider } from './context/SorteoContext';
import EmergencyBlackoutScreen from './components/EmergencyBlackoutScreen';
import BlockedIpScreen from './components/BlockedIpScreen';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import SEO from './components/SEO';
import SorteoHomeBanner from './components/SorteoHomeBanner';

import Breadcrumbs from './components/Breadcrumbs';

const About = lazy(() => import('./components/About'));
const Programs = lazy(() => import('./components/Programs'));
const Platforms = lazy(() => import('./components/Platforms'));
const Calendar = lazy(() => import('./components/Calendar'));
const News = lazy(() => import('./components/News'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const Contact = lazy(() => import('./components/Contact'));
const Gallery = lazy(() => import('./components/Gallery'));
const Enrollment = lazy(() => import('./components/Enrollment'));
const Login = lazy(() => import('./components/Login'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const LiveStream = lazy(() => import('./components/LiveStream'));
const StaffDirectory = lazy(() => import('./components/StaffDirectory'));
const HelpDesk = lazy(() => import('./components/HelpDesk'));
const SorteosPublicPage = lazy(() => import('./components/SorteosPublicPage'));

function Home() {
  return (
    <main>
      <SEO path="/" />
      <Hero />
      <SorteoHomeBanner />
      <Suspense fallback={
        <div className="py-24 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-4 border-primario/20 border-t-primario animate-spin"></span>
        </div>
      }>
        <About />
        <Programs />
        <Platforms />
        <Calendar />
        <News />
        <Testimonials />
        <Contact />
      </Suspense>
    </main>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin' || location.pathname === '/login';
  const { lockdownState, isCurrentClientBanned } = useCybersecurity();
  
  if (isCurrentClientBanned && !isAdminPath) {
    return <BlockedIpScreen />;
  }

  if (lockdownState.isActive && !isAdminPath) {
    return <EmergencyBlackoutScreen />;
  }

  return (
    <div className="min-h-screen bg-primario/[3%] font-sans text-texto selection:bg-blue-200 flex flex-col overflow-x-hidden">
      {!isAdminPath && <Header />}
      <Breadcrumbs />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-4 border-primario/20 border-t-primario animate-spin"></span>
        </div>
      }>
        {children}
      </Suspense>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <Chatbot />}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <SiteContentProvider>
        <AuthProvider>
          <CybersecurityProvider>
            <SorteoProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/sorteos" element={<SorteosPublicPage />} />
                    <Route path="/sorteo" element={<SorteosPublicPage />} />
                    <Route path="/rifas" element={<SorteosPublicPage />} />
                    <Route path="/rifa" element={<SorteosPublicPage />} />
                    <Route path="/galeria" element={<Gallery />} />
                    <Route path="/inscripcion" element={<Enrollment />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/privacidad" element={<PrivacyPolicy />} />
                    <Route path="/terminos" element={<TermsOfService />} />
                    <Route path="/en-vivo" element={<LiveStream />} />
                    <Route path="/directorio" element={<StaffDirectory />} />
                    <Route path="/helpdesk" element={<HelpDesk />} />
                    <Route path="/soporte" element={<HelpDesk />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </SorteoProvider>
          </CybersecurityProvider>
        </AuthProvider>
      </SiteContentProvider>
    </HelmetProvider>
  );
}
