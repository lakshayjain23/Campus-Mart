import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  PlusCircle,
  Menu,
  X,
  MapPin,
  ChevronDown,
  User,
  ShieldCheck,
  Package,
  Plus,
  Check,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { CATEGORIES } from '../data/mockProducts';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    wishlistCount,
    campuses,
    selectedCampus,
    setSelectedCampus,
    setIsCollegeModalOpen,
    searchQuery,
    setSearchQuery,
  } = useMarketplace();

  const navigate = useNavigate();
  const location = useLocation();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const campusRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Synchronize local search with global
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (campusRef.current && !campusRef.current.contains(e.target as Node)) {
        setCampusDropdownOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      navigate(`/explore?search=${encodeURIComponent(localSearch.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Top Campus Location & Trust Ribbon */}
      <div className="bg-[#064E3B] text-emerald-100 py-1.5 px-3 sm:px-6 lg:px-8 w-full overflow-hidden border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs gap-2">
          {/* Active Campus Indicator & Switcher Button */}
          <button
            type="button"
            onClick={() => setIsCollegeModalOpen(true)}
            className="flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors cursor-pointer min-w-0 group"
            title="Click to switch your college"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
            <span className="font-semibold text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[280px]">
              {selectedCampus}
            </span>
            <span className="text-[10px] text-emerald-300 group-hover:underline underline-offset-2 shrink-0">
              (Switch)
            </span>
          </button>

          {/* Safe Handovers Badge */}
          <div className="flex items-center gap-2 sm:gap-4 text-emerald-200 text-[10px] sm:text-xs shrink-0">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
              <span className="whitespace-nowrap">Hostel Safe Handovers</span>
            </span>
            <span className="hidden md:inline">• Zero Commission</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2 sm:gap-4">
          {/* Logo & Campus Selector */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-sm group-hover:bg-[#15803D] transition-colors shrink-0">
                <Package className="w-5 h-5 text-[#22C55E]" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-[#064E3B] tracking-tight leading-none whitespace-nowrap shrink-0">
                Campus<span className="text-[#15803D]">Mart</span>
              </span>
            </Link>

            {/* Campus selector dropdown (Tablet & Desktop: md+) */}
            <div className="relative hidden md:block" ref={campusRef}>
              <button
                type="button"
                onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-950 transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="max-w-[100px] lg:max-w-[150px] truncate">{selectedCampus}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {campusDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select College</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCampusDropdownOpen(false);
                        setIsCollegeModalOpen(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold lowercase tracking-normal flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>add new</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {campuses.map((campus) => (
                      <button
                        key={campus}
                        type="button"
                        onClick={() => {
                          setSelectedCampus(campus);
                          setCampusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          selectedCampus === campus
                            ? 'font-bold text-emerald-900 bg-emerald-50/80'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{campus}</span>
                        {selectedCampus === campus && (
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Add College button at bottom of dropdown - single + icon */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCampusDropdownOpen(false);
                        setIsCollegeModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Add More Colleges</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar (Tablet & Desktop: md+) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-sm lg:max-w-xl mx-2 hidden md:block"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search books, electronics, fashion and more..."
                className="w-full pl-9 lg:pl-10 pr-20 lg:pr-24 py-2 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs lg:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 lg:left-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 lg:right-1.5 px-3 lg:px-4 py-1 lg:py-1.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full transition-colors shadow-xs"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop & Tablet Navigation Links & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
            {/* Explore Link */}
            <Link
              to="/explore"
              className={`hidden sm:inline-flex px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                location.pathname === '/explore'
                  ? 'text-[#064E3B] font-semibold bg-emerald-50'
                  : 'text-slate-700 hover:text-[#064E3B] hover:bg-slate-50'
              }`}
            >
              Explore
            </Link>

            {/* Categories dropdown (Large Screens: xl+) */}
            <div className="relative hidden xl:block" ref={catRef}>
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#064E3B] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/explore?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setCategoriesDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-medium transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sell an Item CTA (Tablet & Desktop: md+) */}
            <Link
              to="/sell"
              className="hidden md:inline-flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-full bg-[#15803D] hover:bg-[#064E3B] text-white text-xs lg:text-sm font-medium transition-all shadow-xs hover:shadow whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-[#22C55E]" />
              <span>Sell an Item</span>
            </Link>

            {/* Wishlist Link (Tablet & Desktop: md+) */}
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="hidden md:inline-flex relative p-2 rounded-lg text-slate-700 hover:text-[#064E3B] hover:bg-slate-50 transition-colors"
            >
              <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link (Tablet & Desktop: md+) */}
            <Link
              to="/cart"
              aria-label="Cart"
              className="hidden md:inline-flex relative p-2 rounded-lg text-slate-700 hover:text-[#064E3B] hover:bg-slate-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#15803D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile dropdown */}
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-800" />
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">Student Account</p>
                    <p className="text-[11px] text-slate-500 truncate">demo.student@campus.edu</p>
                  </div>
                  <Link
                    to="/sell"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    My Active Listings
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Saved Items
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsCollegeModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 font-semibold"
                    >
                      Change College ({selectedCampus.split(' - ')[0]})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input (Visible on mobile screens) */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search books, electronics, fashion..."
                className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15803D]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1 bg-[#064E3B] text-white text-xs font-semibold rounded-full"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl">
          {/* Campus selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Selected Campus
            </label>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsCollegeModalOpen(true);
              }}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 flex items-center justify-between hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{selectedCampus}</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-bold shrink-0 ml-2">Switch / Add +</span>
            </button>
          </div>

          <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Home
            </Link>
            <Link
              to="/explore"
              className="px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/sell"
              className="px-3 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-lg flex items-center justify-between"
            >
              <span>Sell an Item</span>
              <PlusCircle className="w-4 h-4 text-emerald-700" />
            </Link>
            <Link
              to="/wishlist"
              className="px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#15803D] text-white text-xs px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Categories Quick List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Browse Categories
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/explore?category=${encodeURIComponent(cat.name)}`}
                  className="px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 truncate"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
