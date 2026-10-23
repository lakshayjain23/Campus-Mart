import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  MessageSquare,
  GraduationCap,
  Loader2,
  Clock,
  RotateCcw,
  Archive,
  BookOpen,
  Home,
  Compass,
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Product, ListingStatus, Condition } from '../types/product';
import {
  fetchSellerProducts,
  updateProductListing,
  deleteProductListing,
  renewProductListing,
  fetchSellerReceivedEnquiries,
} from '../lib/supabase';
import { validateListingContent } from '../lib/guardrails';
import { formatPriceINR, getConditionBadge } from '../lib/utils';
import { CATEGORIES } from '../data/mockProducts';

export const SellerDashboardPage: React.FC = () => {
  const { user, profile, openAuthModal } = useAuth();
  const { selectedCampus } = useMarketplace();

  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(user));
  const [activeTab, setActiveTab] = useState<'listings' | 'enquiries'>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold' | 'archived'>('all');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Course Textbooks');
  const [editCondition, setEditCondition] = useState<Condition>('like_new');
  const [editStatus, setEditStatus] = useState<ListingStatus>('available');
  const [editPickupLocation, setEditPickupLocation] = useState('');

  // Category specific fields for editor
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editSemester, setEditSemester] = useState('1st Semester');
  const [editAuthor, setEditAuthor] = useState('');
  const [editEdition, setEditEdition] = useState('');
  const [editDormType, setEditDormType] = useState('Electric Kettle');
  const [editDimensions, setEditDimensions] = useState('');
  const [editMobilityType, setEditMobilityType] = useState('Bicycle (Geared)');
  const [editGears, setEditGears] = useState('21-Speed');
  const [editHasLock, setEditHasLock] = useState(true);
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCompatibility, setEditCompatibility] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    const userId = user.id;

    async function loadData(uid: string) {
      try {
        const [sellerProds, recEnquiries] = await Promise.all([
          fetchSellerProducts(uid),
          fetchSellerReceivedEnquiries(uid).catch(() => []),
        ]);
        if (isMounted) {
          setProducts(sellerProds);
          setEnquiries(recEnquiries);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading seller dashboard data:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData(userId);

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenEdit = (p: Product) => {
    // Ownership authorization check
    if (user && p.seller.id !== user.id) {
      alert('Unauthorized: You can only edit your own listings.');
      return;
    }

    setEditingProduct(p);
    setEditTitle(p.title);
    setEditPrice(p.price);
    setEditDescription(p.description);
    setEditCategory(p.category);
    setEditCondition(p.condition);
    setEditStatus(p.status || (p.inStock ? 'available' : 'sold'));
    setEditPickupLocation(p.pickupLocation || '');

    // Load category-specific fields
    const catFields = (p.categoryFields as any) || {};
    setEditCourseCode(p.courseCode || catFields.courseCode || '');
    setEditSemester(p.semester || catFields.semester || '1st Semester');
    setEditAuthor(catFields.author || '');
    setEditEdition(catFields.edition || '');
    setEditDormType(catFields.itemType || 'Electric Kettle');
    setEditDimensions(catFields.dimensions || '');
    setEditMobilityType(catFields.mobilityType || 'Bicycle (Geared)');
    setEditGears(catFields.gearCount || '21-Speed');
    setEditHasLock(catFields.hasLock ?? true);
    setEditBrand(catFields.brand || '');
    setEditModel(catFields.model || '');
    setEditCompatibility(catFields.compatibility || '');

    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Authorization verification
    if (user && editingProduct.seller.id !== user.id) {
      setEditError('Unauthorized: You can only edit your own listings.');
      return;
    }

    // Sold listings lifecycle enforcement: sold items cannot be reopened
    if (editingProduct.status === 'sold' && editStatus !== 'sold') {
      setEditError('Sold listings are finalized and cannot be reopened. Please create a new listing.');
      return;
    }

    // Form validations
    if (!editTitle.trim() || editTitle.trim().length < 5) {
      setEditError('Product title must be at least 5 characters.');
      return;
    }
    if (editPrice < 0) {
      setEditError('Price cannot be negative.');
      return;
    }
    if (!editDescription.trim() || editDescription.trim().length < 20) {
      setEditError('Description must be at least 20 characters.');
      return;
    }

    // Safety text guardrails
    const guardCheck = validateListingContent(editTitle, editDescription);
    if (!guardCheck.isValid) {
      setEditError(guardCheck.reason || 'Content violates campus safety guidelines.');
      return;
    }

    // Textbook validation
    if (editCategory === 'Course Textbooks' || editCategory === 'Books & Study Materials') {
      if (!editCourseCode.trim()) {
        setEditError('Course Code is required for Course Textbooks.');
        return;
      }
    }

    setIsSaving(true);
    setEditError(null);

    // Package category attributes
    let categoryFields: Record<string, any> = {};
    if (editCategory === 'Course Textbooks' || editCategory === 'Books & Study Materials') {
      categoryFields = {
        courseCode: editCourseCode.trim().toUpperCase(),
        semester: editSemester,
        author: editAuthor.trim() || undefined,
        edition: editEdition.trim() || undefined,
      };
    } else if (editCategory === 'Dorm & Room Essentials' || editCategory === 'Hostel Essentials') {
      categoryFields = {
        itemType: editDormType,
        dimensions: editDimensions.trim() || undefined,
      };
    } else if (editCategory === 'Campus Mobility') {
      categoryFields = {
        mobilityType: editMobilityType,
        gearCount: editGears,
        hasLock: editHasLock,
      };
    } else if (editCategory === 'Electronics & Accessories' || editCategory === 'Electronics') {
      categoryFields = {
        brand: editBrand.trim() || undefined,
        model: editModel.trim() || undefined,
        compatibility: editCompatibility.trim() || undefined,
      };
    }

    try {
      await updateProductListing(editingProduct.id, {
        title: editTitle.trim(),
        price: editPrice,
        description: editDescription.trim(),
        category: editCategory,
        condition: editCondition,
        status: editStatus,
        inStock: editStatus === 'available',
        pickupLocation: editPickupLocation.trim() || editingProduct.pickupLocation,
        courseCode: editCourseCode ? editCourseCode.trim().toUpperCase() : undefined,
        semester: editSemester,
        categoryFields,
      });

      // Update state only after confirmed success
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                title: editTitle.trim(),
                price: editPrice,
                description: editDescription.trim(),
                category: editCategory,
                condition: editCondition,
                status: editStatus,
                inStock: editStatus === 'available',
                pickupLocation: editPickupLocation.trim() || item.pickupLocation,
                courseCode: editCourseCode ? editCourseCode.trim().toUpperCase() : undefined,
                semester: editSemester,
                categoryFields,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setActionMessage('Listing updated successfully!');
      setTimeout(() => setActionMessage(null), 3500);
      setEditingProduct(null);
    } catch (err: any) {
      // Do not clear form on failure
      setEditError(err.message || 'Could not update listing. Please verify inputs and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSold = async (product: Product) => {
    const isCurrentlySold = product.status === 'sold' || !product.inStock;
    const newStatus: ListingStatus = isCurrentlySold ? 'available' : 'sold';

    try {
      await updateProductListing(product.id, {
        status: newStatus,
        inStock: newStatus === 'available',
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, status: newStatus, inStock: newStatus === 'available' }
            : item
        )
      );

      setActionMessage(newStatus === 'sold' ? 'Marked as sold! Historical record preserved.' : 'Marked as available for campus buyers!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleRenew = async (product: Product) => {
    setRenewingId(product.id);
    try {
      const nextExpiry = await renewProductListing(product.id);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                expiresAt: nextExpiry,
                status: 'available',
                inStock: true,
              }
            : item
        )
      );
      setActionMessage('Listing successfully renewed for an additional 21 days!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to renew listing: ${err.message}`);
    } finally {
      setRenewingId(null);
    }
  };

  const handleToggleArchive = async (product: Product) => {
    const isCurrentlyArchived = product.status === 'archived';
    const newStatus: ListingStatus = isCurrentlyArchived ? 'available' : 'archived';

    try {
      await updateProductListing(product.id, {
        status: newStatus,
        inStock: newStatus === 'available',
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, status: newStatus, inStock: newStatus === 'available' }
            : item
        )
      );

      setActionMessage(
        newStatus === 'archived'
          ? 'Listing archived and hidden from public search.'
          : 'Listing restored to active marketplace!'
      );
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Could not update archive status: ${err.message}`);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;

    try {
      await deleteProductListing(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setActionMessage('Listing permanently deleted from Campus Mart.');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Could not delete listing: ${err.message}`);
    }
  };

  // Filter listings based on status sub-tab
  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'available') return p.status === 'available' || (p.inStock && p.status !== 'reserved' && p.status !== 'sold' && p.status !== 'archived');
    if (statusFilter === 'reserved') return p.status === 'reserved';
    if (statusFilter === 'sold') return p.status === 'sold' || p.inStock === false;
    if (statusFilter === 'archived') return p.status === 'archived';
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Seller Dashboard</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sign in with your verified campus student account to manage your listings, edit prices, renew 21-day expiries, and track handovers.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            Sign In to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl border border-emerald-200">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name || 'Student Seller'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Student</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {profile?.college || selectedCampus} • {profile?.department || 'Student'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/messages"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Messages</span>
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Listing</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Listings
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {products.length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Available / Active
              </span>
              <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                {products.filter((p) => p.status === 'available' || (p.inStock && p.status !== 'sold' && p.status !== 'reserved' && p.status !== 'archived')).length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Reserved / Meeting
              </span>
              <span className="text-xl font-black text-amber-700 mt-0.5 block">
                {products.filter((p) => p.status === 'reserved').length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sold & Completed
              </span>
              <span className="text-xl font-black text-slate-600 mt-0.5 block">
                {products.filter((p) => p.status === 'sold' || p.inStock === false).length}
              </span>
            </div>
          </div>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Primary Tabs */}
        <div className="flex border-b border-slate-200 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'listings'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Listings ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'enquiries'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Buyer Inquiries ({enquiries.length})
          </button>
        </div>

        {/* Secondary Status Sub-Filters for Listings */}
        {activeTab === 'listings' && products.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {[
              { id: 'all', label: 'All Listings' },
              { id: 'available', label: 'Active Available' },
              { id: 'reserved', label: 'Reserved / Pending' },
              { id: 'sold', label: 'Sold' },
              { id: 'archived', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#064E3B] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#064E3B] mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading your listings from Supabase...</p>
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const badge = getConditionBadge(product.condition);
                  const isExpired = product.expiresAt ? new Date(product.expiresAt).getTime() < now : false;
                  const displayStatus = isExpired ? 'archived' : (product.status || (product.inStock ? 'available' : 'sold'));
                  const daysLeft = product.expiresAt
                    ? Math.max(0, Math.ceil((new Date(product.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
                    : 21;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <img
                            src={product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                            alt={product.title}
                            className="w-20 h-20 rounded-2xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  displayStatus === 'available'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : displayStatus === 'reserved'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : displayStatus === 'sold'
                                    ? 'bg-slate-100 text-slate-600 line-through'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {displayStatus === 'available'
                                  ? 'Available'
                                  : displayStatus === 'reserved'
                                  ? 'Reserved'
                                  : displayStatus === 'sold'
                                  ? 'Sold'
                                  : 'Archived / Expired'}
                              </span>
                            </div>

                            <Link
                              to={`/product/${product.id}`}
                              className="font-bold text-sm text-slate-900 hover:text-[#064E3B] line-clamp-1"
                            >
                              {product.title}
                            </Link>

                            {product.courseCode && (
                              <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                                {product.courseCode} • {product.semester || 'Academic'}
                              </p>
                            )}

                            <p className="text-xs font-black text-emerald-800 mt-1">
                              {formatPriceINR(product.price)}
                            </p>

                             {/* Expiry date timer */}
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {isExpired
                                  ? 'Expired'
                                  : `${daysLeft} days left${product.expiresAt ? ` (${new Date(product.expiresAt).toLocaleDateString('en-IN')})` : ''}`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSold(product)}
                            className={`px-2.5 py-1.5 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer ${
                              product.status === 'sold' || !product.inStock
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            {product.status === 'sold' || !product.inStock ? 'Mark Available' : 'Mark Sold'}
                          </button>

                          {/* Renew 21-day button */}
                          <button
                            type="button"
                            disabled={renewingId === product.id}
                            onClick={() => handleRenew(product)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Renew listing for 21 more days"
                          >
                            <RotateCcw className={`w-3 h-3 ${renewingId === product.id ? 'animate-spin' : ''}`} />
                            <span>Renew</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Edit listing details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                            title={product.status === 'archived' ? 'Unarchive listing' : 'Archive listing'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/product/${product.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                            title="View live listing"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  No listings found in this category
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Declutter your hostel room! Turn textbooks, electronics, and supplies into cash.
                </p>
                <Link
                  to="/sell"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post First Listing</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {enquiries.length > 0 ? (
              <div className="space-y-4">
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Listing: {enquiry.product_title}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {enquiry.buyer_name || 'Campus Student'} ({enquiry.buyer_email || 'Verified Buyer'})
                      </h4>
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{enquiry.message}"
                      </p>
                      {enquiry.preferred_meetup && (
                        <p className="text-[11px] text-slate-500 mt-2">
                          <strong>Preferred Meetup:</strong> {enquiry.preferred_meetup}
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(enquiry.created_at).toLocaleDateString('en-IN')}
                      </span>
                      <Link
                        to="/messages"
                        className="px-3 py-1.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply in Chat</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Buyer Inquiries Yet</h3>
                <p className="text-xs text-slate-500">
                  When fellow campus students enquire about your active listings, their messages and meetup preferences will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Edit Listing Modal with Category-Specific Fields */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Listing Details</h3>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Category Specific Form in Editor */}
              {(editCategory === 'Course Textbooks' || editCategory === 'Books & Study Materials') && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1 font-bold text-emerald-900">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Course Textbook Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Course Code *</label>
                      <input
                        type="text"
                        required
                        value={editCourseCode}
                        onChange={(e) => setEditCourseCode(e.target.value)}
                        placeholder="e.g. CS201"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Semester</label>
                      <input
                        type="text"
                        value={editSemester}
                        onChange={(e) => setEditSemester(e.target.value)}
                        placeholder="e.g. 3rd Semester"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(editCategory === 'Dorm & Room Essentials' || editCategory === 'Hostel Essentials') && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1 font-bold text-amber-900">
                    <Home className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dorm Item Specs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Item Type</label>
                      <input
                        type="text"
                        value={editDormType}
                        onChange={(e) => setEditDormType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Dimensions</label>
                      <input
                        type="text"
                        value={editDimensions}
                        onChange={(e) => setEditDimensions(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editCategory === 'Campus Mobility' && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1 font-bold text-blue-900">
                    <Compass className="w-3.5 h-3.5 text-blue-700" />
                    <span>Mobility Specs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Vehicle Type</label>
                      <input
                        type="text"
                        value={editMobilityType}
                        onChange={(e) => setEditMobilityType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Gears</label>
                      <input
                        type="text"
                        value={editGears}
                        onChange={(e) => setEditGears(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(editCategory === 'Electronics & Accessories' || editCategory === 'Electronics') && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1 font-bold text-purple-900">
                    <Laptop className="w-3.5 h-3.5 text-purple-700" />
                    <span>Electronics Specs</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Brand</label>
                      <input
                        type="text"
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Model</label>
                      <input
                        type="text"
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Compatibility</label>
                      <input
                        type="text"
                        value={editCompatibility}
                        onChange={(e) => setEditCompatibility(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ListingStatus)}
                  disabled={editingProduct?.status === 'sold'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D] disabled:opacity-60"
                >
                  {editingProduct?.status === 'sold' ? (
                    <option value="sold">Sold (Finalized)</option>
                  ) : (
                    <>
                      <option value="available">Available for Purchase</option>
                      <option value="reserved">Reserved / Meeting Pending</option>
                      <option value="sold">Sold</option>
                      <option value="archived">Archived / Hidden</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Spot
                </label>
                <input
                  type="text"
                  value={editPickupLocation}
                  onChange={(e) => setEditPickupLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving to Supabase...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardPage;
