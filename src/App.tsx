import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { CollegeSelectorModal } from './components/CollegeSelectorModal';
import { AuthModal } from './components/AuthModal';

// Code-split pages for instant route performance
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const SellPage = lazy(() => import('./pages/SellPage').then((m) => ({ default: m.SellPage })));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const SafetyGuidelinesPage = lazy(() => import('./pages/SafetyGuidelinesPage').then((m) => ({ default: m.SafetyGuidelinesPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const ModerationPage = lazy(() => import('./pages/ModerationPage').then((m) => ({ default: m.ModerationPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-3 border-emerald-200 border-t-[#064E3B] rounded-full animate-spin mb-3" />
    <span className="text-xs font-semibold text-slate-500">Loading Campus Mart...</span>
  </div>
);

// Scroll to top helper on route transitions
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketplaceProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900 overflow-x-hidden w-full min-w-0">
              <Navbar />
              <CollegeSelectorModal />
              <AuthModal />
              <main className="flex-1 pb-24 md:pb-0 w-full min-w-0">
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/sell" element={<SellPage />} />
                    <Route path="/dashboard" element={<SellerDashboardPage />} />
                    <Route path="/orders" element={<MyOrdersPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/moderation" element={<ModerationPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/safety" element={<SafetyGuidelinesPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <MobileBottomNav />
            </div>
          </Router>
        </MarketplaceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
