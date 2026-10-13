import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  PlusCircle,
  Zap,
  ShoppingBag,
  Sparkles,
  MapPin,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { CATEGORIES } from '../data/mockProducts';
import { ProductCard } from '../components/ProductCard';
import { CategoryCard } from '../components/CategoryCard';

const QUICK_TAGS = [
  'Scientific Calculator',
  'GATE CS Notes',
  'Electric Kettle',
  'Campus Cycle',
  'Lab Coat',
  '3D Printed Accessories',
];

export const HomePage: React.FC = () => {
  const {
    products,
    selectedCampus,
    setSelectedCampus,
    setIsCollegeModalOpen,
    setSearchQuery,
  } = useMarketplace();

  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setSearchQuery(heroSearch.trim());
      navigate(`/explore?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/explore?search=${encodeURIComponent(tag)}`);
  };

  // Filter products by selected campus strictly
  const campusProducts = useMemo(() => {
    if (selectedCampus === 'All Campuses') return products;
    const prefix = selectedCampus.split(' - ')[0].toLowerCase().trim();
    return products.filter((p) =>
      p.campus.toLowerCase().includes(prefix) ||
      p.campus.toLowerCase() === selectedCampus.toLowerCase()
    );
  }, [products, selectedCampus]);

  const featuredProducts = useMemo(() => {
    if (selectedCampus === 'All Campuses') {
      return products.filter((p) => p.featured).slice(0, 8);
    }
    const feat = campusProducts.filter((p) => p.featured);
    return (feat.length > 0 ? feat : campusProducts).slice(0, 8);
  }, [products, campusProducts, selectedCampus]);

  const recentProducts = useMemo(() => {
    if (selectedCampus === 'All Campuses') {
      return products.filter((p) => p.isRecent).slice(0, 8);
    }
    const rec = campusProducts.filter((p) => p.isRecent);
    return (rec.length > 0 ? rec : campusProducts).slice(0, 8);
  }, [products, campusProducts, selectedCampus]);

  return (
    <div className="min-h-screen bg-white">
      {/* ========================================================
          B. SEARCH-LED HERO SECTION
      ======================================================== */}
      <section className="relative bg-gradient-to-b from-[#064E3B]/8 via-slate-50 to-white py-12 md:py-20 border-b border-slate-100 overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#22C55E]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#064E3B]/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Interactive Campus Location Pill / Selector */}
          <button
            type="button"
            onClick={() => setIsCollegeModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-500 text-xs font-semibold text-emerald-950 shadow-xs mb-6 transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Campus: <strong className="text-emerald-900 underline decoration-emerald-500/50 underline-offset-2">{selectedCampus}</strong>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold ml-1 group-hover:bg-emerald-200 transition-colors">
              Switch / Add +
            </span>
          </button>

          {/* Headline & Description */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-3 sm:mb-4">
            Everything Your Campus Needs, <br className="hidden sm:inline" />
            <span className="text-[#064E3B]">All in One Place.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 font-normal px-2">
            Discover products, find great deals, and connect with your campus community.
          </p>

          {/* Prominent Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <form onSubmit={handleHeroSearch} className="relative shadow-md sm:shadow-lg rounded-full">
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search books, electronics, fashion and more..."
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-full text-xs sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#15803D] focus:ring-4 focus:ring-[#15803D]/10 transition-all"
              />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold rounded-full transition-all shadow-xs cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-8">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 mr-1 w-full sm:w-auto text-center sm:text-left mb-1 sm:mb-0">Popular Searches:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 sm:px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-full text-[11px] sm:text-xs text-slate-600 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Primary & Secondary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/explore"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#064E3B] hover:bg-[#15803D] text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-[#22C55E]" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/sell"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-emerald-400 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Start Selling</span>
            </Link>
          </div>

          {/* Trust stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200/80 text-left">
            <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Student Verified</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Peer verified IDs</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Zero Commission</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Keep 100% of price</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Instant Handovers</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Meet on campus</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Student Made</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Crafts & prints</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          C. POPULAR CATEGORIES
      ======================================================== */}
      <section className="py-12 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Explore by Dept & Need
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Popular Categories
              </h2>
            </div>
            <Link
              to="/explore"
              className="text-xs sm:text-sm font-semibold text-[#15803D] hover:text-[#064E3B] flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          D. FEATURED PRODUCTS
      ======================================================== */}
      <section className="py-10 sm:py-14 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {selectedCampus === 'All Campuses' ? 'Curated For Students' : `Listings from ${selectedCampus}`}
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Featured Campus Listings
              </h2>
            </div>
            <Link
              to="/explore?sort=popular"
              className="text-xs sm:text-sm font-semibold text-[#15803D] hover:text-[#064E3B] flex items-center gap-1"
            >
              <span>See more</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto">
              <GraduationCap className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">
                No active listings yet at {selectedCampus}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Be the first student to post an item from your college or browse all campuses!
              </p>
              <div className="flex items-center justify-center gap-2">
                <Link
                  to="/sell"
                  className="px-4 py-2 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs"
                >
                  + Post an Item Here
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCampus('All Campuses')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-full"
                >
                  Browse All
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          E. RECENTLY LISTED PRODUCTS
      ======================================================== */}
      <section className="py-10 sm:py-14 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Just Posted
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Recently Listed Products
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fresh listings from students across hostels & academic blocks
              </p>
            </div>
            <Link
              to="/explore?sort=newest"
              className="text-xs sm:text-sm font-semibold text-[#15803D] hover:text-[#064E3B] flex items-center gap-1"
            >
              <span>View all recent</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              <p>No recent items for this college.</p>
              <button
                onClick={() => setSelectedCampus('All Campuses')}
                className="text-emerald-700 font-semibold underline mt-1"
              >
                Switch to All Campuses
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          F. SELLER PROMOTION SECTION
      ======================================================== */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-r from-[#064E3B] via-[#065F46] to-[#15803D] text-white p-8 sm:p-12 overflow-hidden shadow-xl">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-[#22C55E]/20 blur-2xl pointer-events-none" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-4 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                Hostel Cleanout or Creative Side-Hustle?
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
                Have Something to Sell?
              </h2>

              <p className="text-sm sm:text-base text-emerald-100/90 mb-6 leading-relaxed">
                List your products and connect with students on your campus. Whether it’s an engineering book you’ve finished, lab essentials, or custom merchandise you created — sell directly within minutes.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/sell"
                  className="px-6 py-3 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-[#064E3B] font-bold text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-[#064E3B]" />
                  <span>List a Product</span>
                </Link>

                <div className="flex items-center gap-4 text-xs text-emerald-200">
                  <span>✓ 100% Free Listing</span>
                  <span>✓ Direct UPI Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          G. BENEFITS SECTION
      ======================================================== */}
      <section className="py-14 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Built Specifically for Campus Life
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Why Campus Mart Works Better
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed around the everyday needs of university students, hostellers, and campus creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Convenient Discovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Locate books, hardware, and furniture already inside your campus perimeter. No long courier waits or delivery fees.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Student Affordability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save 50% to 70% compared to retail prices on textbooks, lab drafters, gym weights, and electronics from passing batches.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Diverse Variety</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                From brand new surplus items and pre-loved study aids to unique handcrafted art and 3D printed accessories by campus peers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Peer-to-Peer Trust</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinate handovers in familiar campus spots like the student canteen or hostel lobby. Inspect items in person before paying.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
