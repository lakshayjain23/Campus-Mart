import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { CollegeSelectorModal } from './components/CollegeSelectorModal';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellPage } from './pages/SellPage';
import { WishlistPage } from './pages/WishlistPage';
import { CartPage } from './pages/CartPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SafetyGuidelinesPage } from './pages/SafetyGuidelinesPage';
import { ContactPage } from './pages/ContactPage';

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
    <MarketplaceProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900 overflow-x-hidden w-full min-w-0">
          <Navbar />
          <CollegeSelectorModal />
          <main className="flex-1 pb-24 md:pb-0 w-full min-w-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/sell" element={<SellPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/safety" element={<SafetyGuidelinesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      </Router>
    </MarketplaceProvider>
  );
};

export default App;
