import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/mockProducts';
import type { Condition } from '../types/product';

export const ExplorePage: React.FC = () => {
  const {
    products,
    selectedCampus,
    setIsCollegeModalOpen,
    searchQuery: globalSearch,
    setSearchQuery: setGlobalSearch,
  } = useMarketplace();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameter sync
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || globalSearch || '';
  const initialSort = (searchParams.get('sort') as any) || 'newest';

  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>(initialSort);
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Update query params when category or search changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  const handleClearFilters = () => {
    setCategoryFilter('All');
    setConditionFilter('all');
    setSearchTerm('');
    setGlobalSearch('');
    setMaxPrice(6000);
    setSortBy('newest');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesTags = product.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      // Campus filter
      if (selectedCampus !== 'All Campuses') {
        const campusKey = selectedCampus.split(' - ')[0].toLowerCase().trim();
        if (!product.campus.toLowerCase().includes(campusKey) && product.campus.toLowerCase() !== selectedCampus.toLowerCase()) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'All' && product.category !== categoryFilter) {
        return false;
      }

      // Condition filter
      if (conditionFilter !== 'all' && product.condition !== conditionFilter) {
        return false;
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'popular') return (b.seller.reviewsCount || 0) - (a.seller.reviewsCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, searchTerm, selectedCampus, categoryFilter, conditionFilter, maxPrice, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const conditions: { label: string; value: Condition | 'all' }[] = [
    { label: 'All Conditions', value: 'all' },
    { label: 'Brand New', value: 'brand_new' },
    { label: 'Like New', value: 'like_new' },
    { label: 'Good Condition', value: 'good' },
    { label: 'Student Made', value: 'student_created' },
  ];

  const hasActiveFilters = categoryFilter !== 'All' || conditionFilter !== 'all' || maxPrice < 6000 || searchTerm !== '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse verified listings across {selectedCampus}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCollegeModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-950 transition-all cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Campus: <strong>{selectedCampus}</strong></span>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold ml-1">Switch / Add +</span>
          </button>
        </div>

        {/* Top Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input inside Explore */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setGlobalSearch(e.target.value);
              }}
              placeholder="Search in current category or campus..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setGlobalSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats & View Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-800" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#15803D]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div className="hidden sm:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-[#064E3B] shadow-2xs' : 'text-slate-400'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-[#064E3B] shadow-2xs' : 'text-slate-400'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              categoryFilter === 'All'
                ? 'bg-[#064E3B] text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            All Categories ({products.length})
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.name;
            const count = products.filter(p => p.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#064E3B] text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:text-emerald-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Main Grid & Sidebar Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Condition Filters */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2.5">
                Item Condition
              </label>
              <div className="space-y-1.5">
                {conditions.map((c) => (
                  <label
                    key={c.value}
                    className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={conditionFilter === c.value}
                      onChange={() => setConditionFilter(c.value)}
                      className="text-[#15803D] focus:ring-[#15803D]"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>Max Price:</span>
                <span className="text-[#064E3B]">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={200}
                max={6000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#15803D] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>₹200</span>
                <span>₹3,000</span>
                <span>₹6,000+</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Budget Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMaxPrice(500)}
                  className="px-2 py-1 text-xs bg-slate-50 hover:bg-emerald-50 rounded border border-slate-200 text-slate-700"
                >
                  Under ₹500
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPrice(1000)}
                  className="px-2 py-1 text-xs bg-slate-50 hover:bg-emerald-50 rounded border border-slate-200 text-slate-700"
                >
                  Under ₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPrice(2500)}
                  className="px-2 py-1 text-xs bg-slate-50 hover:bg-emerald-50 rounded border border-slate-200 text-slate-700"
                >
                  Under ₹2,500
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPrice(6000)}
                  className="px-2 py-1 text-xs bg-slate-50 hover:bg-emerald-50 rounded border border-slate-200 text-slate-700"
                >
                  Any Budget
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="md:col-span-3">
            {/* Active filter badges strip */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                <span className="font-semibold text-emerald-900">Active Filters:</span>
                {categoryFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200 font-medium">
                    Category: {categoryFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter('All')} />
                  </span>
                )}
                {conditionFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200 font-medium">
                    Condition: {conditionFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setConditionFilter('all')} />
                  </span>
                )}
                {maxPrice < 6000 && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200 font-medium">
                    Under ₹{maxPrice}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxPrice(6000)} />
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200 font-medium">
                    "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => { setSearchTerm(''); setGlobalSearch(''); }} />
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-emerald-700 underline ml-auto font-medium"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="text-xs text-slate-500 mb-4 flex items-center justify-between">
              <span>Showing {displayedProducts.length} of {filteredProducts.length} campus listings</span>
            </div>

            {/* Product Grid or Empty State */}
            {displayedProducts.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5'
                  : 'space-y-3 sm:space-y-4'
              }>
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Listings Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  We couldn’t find any items matching your selected filters or search terms. Try adjusting the price range or category.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-full shadow-2xs hover:shadow-xs transition-all"
                >
                  Load More Listings ({filteredProducts.length - displayedProducts.length} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conditions */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-800 mb-2">Item Condition</label>
                <div className="space-y-2">
                  {conditions.map((c) => (
                    <label key={c.value} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="radio"
                        name="mobileCondition"
                        checked={conditionFilter === c.value}
                        onChange={() => setConditionFilter(c.value)}
                        className="text-[#15803D]"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Max Price: ₹{maxPrice}
                </label>
                <input
                  type="range"
                  min={200}
                  max={6000}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#15803D]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2 text-xs font-semibold bg-[#064E3B] text-white rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
