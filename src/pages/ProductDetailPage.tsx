import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Share2,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Check,
  MessageSquare,
  MessageCircle,
  AlertCircle,
  Flag,
  X,
  BookOpen,
  Info,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { getConditionBadge } from '../lib/utils';
import { EnquiryModal } from '../components/EnquiryModal';
import { submitListingReport } from '../lib/supabase';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, toggleWishlist, isInWishlist, addToCart } = useMarketplace();

  const product = products.find((p) => p.id === id);
  const { user, openAuthModal } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'prohibited_item' | 'scam_fake' | 'already_sold' | 'other'>('prohibited_item');
  const [reportExplanation, setReportExplanation] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Listing Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The product you are looking for may have been sold or removed by the seller.
          </p>
          <Link
            to="/explore"
            className="px-5 py-2.5 bg-[#064E3B] text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const badge = getConditionBadge(product.condition);
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const isSold = product.status === 'sold';
  const isReserved = product.status === 'reserved';

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.campus === product.campus))
    .slice(0, 4);

  const handleAddToCart = () => {
    if (isSold) return;
    addToCart(product, 1);
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 2500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 2500);
  };

  const handleChatWithSeller = () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    navigate(`/messages?listingId=${product.id}&sellerId=${product.seller.id}`);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportErrorMessage(null);
    try {
      const res = await submitListingReport({
        listingId: product.id,
        reporterId: user?.id,
        reason: reportReason,
        explanation: reportExplanation.trim() || undefined,
      });
      if (res.error) {
        setReportErrorMessage(res.error.message || 'Failed to submit report. Please try again.');
      } else {
        setReportSuccessMessage('Report submitted. Campus moderators will review this listing shortly.');
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccessMessage(null);
          setReportExplanation('');
        }, 2200);
      }
    } catch (err: any) {
      setReportErrorMessage(err.message || 'Error submitting report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      {/* Toast notifications */}
      {addedToCartToast && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-[#064E3B] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-[#22C55E]" />
          <span>Added to your Cart!</span>
          <Link to="/cart" className="underline font-bold ml-2 text-emerald-200">View Cart</Link>
        </div>
      )}

      {copiedLinkToast && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Listing link copied to clipboard!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/explore" className="hover:text-slate-800">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to={`/explore?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-800">
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Main Product Layout (2 Column Desktop, 1 Column Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* LEFT COLUMN: Image Gallery (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary large image viewer */}
            <div className="relative aspect-[4/3] sm:aspect-square w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />

              {/* Condition Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${badge.bg}`}>
                  {badge.icon ? <Sparkles className="w-3.5 h-3.5 text-purple-600" /> : <span className={`w-2 h-2 rounded-full ${badge.dot}`} />}
                  {badge.label}
                </span>
              </div>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-transform active:scale-110 ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white/90 text-slate-700 hover:bg-white hover:text-red-500'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-current'}`} />
              </button>

              {/* Discount Tag */}
              {discountPercent && (
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="bg-[#15803D] text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#064E3B] ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Campus Safety Notice Alert */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Campus Safe Handover Guidelines</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Meet in open campus areas like the Student Activity Center, central canteen, or library lawn. Always verify physical condition before completing the UPI transfer.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details & Purchase Actions (7 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Status Alert if Sold or Reserved */}
              {isSold && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Item Sold: </span>
                    This listing has been purchased and is no longer available.
                  </div>
                </div>
              )}
              {isReserved && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Reserved / Meetup Pending: </span>
                    A student has expressed intent to buy this item. You may still message the seller in case the meetup falls through.
                  </div>
                </div>
              )}

              {/* Category & Campus */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      {product.category}
                    </span>
                    {product.courseCode && (
                      <span className="bg-blue-50 text-blue-700 font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200">
                        {product.courseCode} {product.semester ? `(Sem ${product.semester})` : ''}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>

                {/* Campus location pin */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{product.campus}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{product.pickupLocation}</span>
                </div>
              </div>

              {/* Price display */}
              <div className="pt-4 border-t border-slate-100 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Save ₹{(product.originalPrice! - product.price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Primary Call to Actions */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* In-App Direct Chat */}
                  <button
                    onClick={handleChatWithSeller}
                    className="w-full py-3.5 px-5 bg-[#064E3B] hover:bg-[#15803D] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                    <span>Chat in App</span>
                  </button>

                  {/* Add to Cart / Reservation */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isSold}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 ${
                      isSold
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#15803D] hover:bg-[#16A34A] text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isSold ? 'Item Sold' : 'Add to Cart / Reserve'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setEnquiryOpen(true)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send quick email enquiry instead</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Direct peer exchange • No fees
                  </p>
                </div>
              </div>

              {/* Verified Seller Profile Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Student Seller Info
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={product.seller.avatarUrl}
                    alt={product.seller.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {product.seller.name}
                      </h4>
                      {product.seller.verifiedStudent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Student Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {product.seller.department} • {product.seller.year}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        {product.seller.rating} ({product.seller.reviewsCount} reviews)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Replies {product.seller.responseTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured Category Details */}
              {(product.courseCode || product.semester || (product.categoryFields && Object.keys(product.categoryFields).length > 0)) && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-3">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Category & Campus Specifics
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.courseCode && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Course Code</span>
                        <span className="font-bold text-blue-700 font-mono">{product.courseCode}</span>
                      </div>
                    )}
                    {product.semester && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Semester</span>
                        <span className="font-semibold text-slate-800">Semester {product.semester}</span>
                      </div>
                    )}
                    {(product.categoryFields as Record<string, any>)?.subject && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Subject</span>
                        <span className="font-semibold text-slate-800">{(product.categoryFields as Record<string, any>).subject}</span>
                      </div>
                    )}
                    {(product.categoryFields as Record<string, any>)?.author && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Author / Edition</span>
                        <span className="font-semibold text-slate-800">{(product.categoryFields as Record<string, any>).author}</span>
                      </div>
                    )}
                    {(product.categoryFields as Record<string, any>)?.brand && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Brand</span>
                        <span className="font-semibold text-slate-800">{(product.categoryFields as Record<string, any>).brand}</span>
                      </div>
                    )}
                    {(product.categoryFields as Record<string, any>)?.model && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Model / Specs</span>
                        <span className="font-semibold text-slate-800">{(product.categoryFields as Record<string, any>).model}</span>
                      </div>
                    )}
                    {(product.categoryFields as Record<string, any>)?.dimensions && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Dimensions</span>
                        <span className="font-semibold text-slate-800">{(product.categoryFields as Record<string, any>).dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    General Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">{key}</span>
                        <span className="font-semibold text-slate-800">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Seller's Description
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Report Listing footer button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Safe student marketplace</span>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 font-medium transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report this listing</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Related Campus Listings
                </h2>
                <p className="text-xs text-slate-500">Other items in {product.category} or nearby hostels</p>
              </div>
              <Link to="/explore" className="text-xs font-semibold text-emerald-800 hover:underline">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={product}
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />

      {/* Report Listing Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setReportModalOpen(false);
                setReportErrorMessage(null);
                setReportSuccessMessage(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-rose-600">
              <Flag className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Report Listing</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Help keep Campus Mart safe. Select the reason this item violates campus marketplace rules.
            </p>

            {reportSuccessMessage ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                {reportErrorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
                    {reportErrorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Violation Reason *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    <option value="prohibited_item">Prohibited Item (Weapons, Alcohol, Drugs, Exam leaks)</option>
                    <option value="scam_fake">Scam / Fake / Advance Wire Fraud</option>
                    <option value="already_sold">Already Sold / Inactive Listing</option>
                    <option value="other">Other Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    placeholder="Provide details for campus moderators..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 block text-right">
                    {reportExplanation.length}/500
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
