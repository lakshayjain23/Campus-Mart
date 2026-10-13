import React, { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Upload,
  Camera,
  Trash2,
  Plus,
  Database,
  Loader2,
  Lock,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useAuth } from '../context/AuthContext';
import { uploadProductImage } from '../lib/supabase';
import type { Condition, Product } from '../types/product';
import { CATEGORIES } from '../data/mockProducts';
import { ProductCard } from '../components/ProductCard';

export const SellPage: React.FC = () => {
  const { addProduct, campuses, addCampus, selectedCampus } = useMarketplace();
  const { user, profile, openAuthModal } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Books & Study Materials');
  const [condition, setCondition] = useState<Condition>('like_new');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Image Upload state (From Device + URL option)
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [useUrlMode, setUseUrlMode] = useState<boolean>(false);

  // Campus & Handover Details
  const defaultCampus = selectedCampus !== 'All Campuses' ? selectedCampus : (campuses.find(c => c !== 'All Campuses') || 'IIT Delhi - Main Campus');
  const [campus, setCampus] = useState(() => profile?.college || defaultCampus);
  const [showAddCampusInline, setShowAddCampusInline] = useState(false);
  const [newCampusInput, setNewCampusInput] = useState('');
  const [hostel, setHostel] = useState(() => profile?.hostel || '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [sellerName, setSellerName] = useState(() => profile?.full_name || '');
  const [department, setDepartment] = useState(() => profile?.department || '');
  const [year, setYear] = useState(() => profile?.year || '3rd Year');

  // Adjust state during render when profile loads
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  if (profile && profile.id !== syncedProfileId) {
    setSyncedProfileId(profile.id);
    if (profile.full_name && !sellerName) setSellerName(profile.full_name);
    if (profile.college && !campus) setCampus(profile.college);
    if (profile.department && !department) setDepartment(profile.department);
    if (profile.year && !year) setYear(profile.year);
    if (profile.hostel && !hostel) setHostel(profile.hostel);
  }

  // Error validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Device File Upload Handler
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (PNG, JPG, WEBP).' }));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image size should be under 8MB.' }));
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setImageFileName(file.name);
    setImageFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    setErrors((prev) => {
      const newErrs = { ...prev };
      delete newErrs.image;
      return newErrs;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageFileName('');
    setImageFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInlineAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCampusInput.trim();
    if (!trimmed) return;
    addCampus(trimmed);
    setCampus(trimmed);
    setNewCampusInput('');
    setShowAddCampusInline(false);
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Please enter a product title.';
    else if (title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!price || Number(price) <= 0) errs.price = 'Please enter a valid price in INR.';
    if (!description.trim()) errs.description = 'Please provide a brief description.';
    else if (description.trim().length < 20) errs.description = 'Description should be at least 20 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!imageUrl) errs.image = 'Please upload a product photo from your device or provide a link.';
    if (!hostel.trim()) errs.hostel = 'Enter your hostel or residential wing.';
    if (!pickupLocation.trim()) errs.pickup = 'Specify a preferred meetup spot.';
    if (!sellerName.trim()) errs.name = 'Enter your student display name.';
    if (!department.trim()) errs.dept = 'Enter your department / branch.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('signin');
      return;
    }

    setIsPublishing(true);

    try {
      let finalImageUrl = imageUrl;
      if (selectedFile) {
        finalImageUrl = await uploadProductImage(selectedFile, user.id);
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newProd = addProduct({
        title,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
        condition,
        images: [finalImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
        campus,
        pickupLocation,
        tags: tags.length ? tags : ['CampusDeal', 'StudentVerified'],
        seller: {
          id: user.id,
          name: profile?.full_name || sellerName || user.email?.split('@')[0] || 'Campus Student',
          department: department || profile?.department || 'Engineering',
          year: year || profile?.year || '3rd Year',
          hostel: hostel || profile?.hostel || 'Hostel',
          rating: 5.0,
          reviewsCount: 1,
          verifiedStudent: true,
          avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          responseTime: 'Under 15 mins',
          campus,
        },
      });

      setCreatedProduct(newProd);
    } catch (err: any) {
      console.error('Publish error:', err);
      alert(`Could not publish listing: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Preview dummy object memoized to avoid impure render date execution
  const previewProduct: Product = useMemo(() => ({
    id: 'preview-temp',
    title: title || 'Untitled Product',
    description: description || 'No description provided.',
    price: Number(price) || 0,
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category,
    condition,
    images: [imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
    campus,
    pickupLocation: pickupLocation || 'Campus Hub',
    tags: tagsInput.split(',').filter(Boolean),
    createdAt: 'Today',
    seller: {
      id: user?.id || 'preview-seller',
      name: profile?.full_name || sellerName || 'Your Name',
      department: department || 'Branch',
      year: year || '3rd Year',
      hostel: hostel || 'Hostel',
      rating: 5.0,
      reviewsCount: 0,
      verifiedStudent: true,
      avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      responseTime: 'Under 15 mins',
      campus,
    },
  }), [
    title,
    description,
    price,
    originalPrice,
    category,
    condition,
    imageUrl,
    campus,
    pickupLocation,
    tagsInput,
    sellerName,
    department,
    year,
    hostel,
    user,
    profile,
  ]);

  // SUCCESS STATE
  if (createdProduct) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex items-center justify-center">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl border border-slate-200 text-center shadow-lg space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-700" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Listing Published
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Your Product is Live on Campus Mart!
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Saved to Supabase Backend</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Students at <strong className="text-slate-800">{campus}</strong> can now discover your listing and make safe hand-off enquiries.
            </p>
          </div>

          {/* Mini Card Preview */}
          <div className="max-w-xs mx-auto text-left">
            <ProductCard product={createdProduct} compact />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/product/${createdProduct.id}`}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
            >
              View Live Listing
            </Link>
            <button
              onClick={() => {
                setCreatedProduct(null);
                setCurrentStep(1);
                setTitle('');
                setPrice('');
                setDescription('');
                handleRemoveImage();
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              List Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Campus Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            List an Item on Campus Mart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fast, zero platform fees, and direct handovers within your college campus
          </p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 sm:mb-8">
          <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold">
            {[
              { step: 1, label: '1. Info', fullLabel: '1. Product Info' },
              { step: 2, label: '2. Price', fullLabel: '2. Pricing & Details' },
              { step: 3, label: '3. Photo', fullLabel: '3. Photo & Location' },
              { step: 4, label: '4. Post', fullLabel: '4. Preview & Post' },
            ].map((s) => (
              <div
                key={s.step}
                className={`py-1.5 sm:py-2 px-1 rounded-lg transition-colors truncate ${
                  currentStep === s.step
                    ? 'bg-[#064E3B] text-white font-bold shadow-2xs'
                    : currentStep > s.step
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <span className="sm:hidden">{s.label}</span>
                <span className="hidden sm:inline">{s.fullLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white p-4 sm:p-8 md:p-10 rounded-2xl border border-slate-200 shadow-xs">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">What are you listing?</h2>
                <p className="text-xs text-slate-500">Provide a clear, specific title and choose the category.</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Casio fx-991CW Scientific Calculator with Slide Case"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
                {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                <p className="text-[11px] text-slate-400 mt-1">
                  Include brand, model, edition, or size to help other students find it.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Condition Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { val: 'brand_new', title: 'Brand New', desc: 'Unopened, never used, with original box/tags' },
                    { val: 'like_new', title: 'Like New', desc: 'Used gently for one term, flawless working condition' },
                    { val: 'good', title: 'Good Condition', desc: 'Minor cosmetic signs of normal student use, fully functional' },
                    { val: 'student_created', title: 'Student Made', desc: 'Handcrafted artwork, 3D printed model, campus merch' },
                  ].map((cond) => (
                    <button
                      key={cond.val}
                      type="button"
                      onClick={() => setCondition(cond.val as Condition)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        condition === cond.val
                          ? 'border-[#064E3B] bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{cond.title}</span>
                        {condition === cond.val && <Check className="w-4 h-4 text-[#064E3B]" />}
                      </div>
                      <p className="text-[11px] text-slate-500">{cond.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing & Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Price & Description</h2>
                <p className="text-xs text-slate-500">Set fair student pricing and describe the item truthfully.</p>
              </div>

              {/* Price fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Your Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 750"
                      className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                  {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Original Retail MRP (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 1499"
                      className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Helps show savings to peer buyers</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe condition, battery health, edition, why you are selling, or what accessories are included..."
                  className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Search Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Casio, Scientific, Calculator, 1stYear, Math"
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Photos & Campus Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Photo & Campus Handover</h2>
                <p className="text-xs text-slate-500">Upload a product photo from your device and specify your college meetup spot.</p>
              </div>

              {/* Device Photo Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Product Photo <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseUrlMode(!useUrlMode)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline cursor-pointer"
                  >
                    {useUrlMode ? '← Upload from Device instead' : 'Or enter an image URL'}
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!useUrlMode ? (
                  <div>
                    {!imageUrl ? (
                      /* Drag and Drop / Device Browse Box */
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
                            : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <Upload className="w-6 h-6 text-emerald-700" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          Click to Add Photo from Device
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                          Choose from your computer files, mobile gallery, or take a picture with your camera (PNG, JPG, WEBP).
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-5 py-2 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-xs inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#22C55E]" />
                          <span>Choose Photo from Device</span>
                        </button>
                      </div>
                    ) : (
                      /* Loaded Image Preview Box */
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
                          <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Photo successfully uploaded from device</span>
                          </div>
                          {imageFileName && (
                            <p className="text-xs text-slate-600 font-medium truncate max-w-sm">
                              {imageFileName} {imageFileSize && `(${imageFileSize})`}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            This photo will appear in the marketplace search and listing page.
                          </p>

                          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-slate-50 cursor-pointer"
                            >
                              Replace Photo
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Alternate URL Mode */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#15803D]"
                      />
                    </div>
                    {imageUrl && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {errors.image && <p className="text-xs text-red-600 mt-2">{errors.image}</p>}
              </div>

              {/* Campus & Hostel Information */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Campus Select + Add College Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Campus / College <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCampusInline(!showAddCampusInline)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New College</span>
                      </button>
                    </div>

                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#15803D]"
                    >
                      {campuses.filter((c) => c !== 'All Campuses').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Inline Add College input if clicked */}
                    {showAddCampusInline && (
                      <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 animate-in fade-in duration-150">
                        <span className="text-[11px] font-bold text-emerald-900 block">
                          Enter College / University Name:
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCampusInput}
                            onChange={(e) => setNewCampusInput(e.target.value)}
                            placeholder="e.g. SRM Institute, VIT Vellore, MIT..."
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleInlineAddCampus}
                            className="px-3 py-1.5 bg-[#064E3B] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#15803D] cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Hostel / Hall of Residence <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      placeholder="e.g. Karakoram Hostel, Wing B"
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#15803D]"
                    />
                    {errors.hostel && <p className="text-xs text-red-600 mt-1">{errors.hostel}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Preferred Handover Spot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Near Student Activity Center (SAC) / Nescafe Lawn"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#15803D]"
                  />
                  {errors.pickup && <p className="text-xs text-red-600 mt-1">{errors.pickup}</p>}
                </div>

                {/* Seller Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. Aarav S."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Mechanical Engg"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                    />
                    {errors.dept && <p className="text-xs text-red-600 mt-1">{errors.dept}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Live Preview & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Preview & Publish</h2>
                <p className="text-xs text-slate-500">Review how your listing appears to fellow students before publishing.</p>
              </div>

              {/* Card Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Marketplace Card View:
                  </span>
                  <div className="max-w-xs">
                    <ProductCard product={previewProduct} />
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Listing Summary:
                  </span>
                  <p><strong className="text-slate-900">Campus:</strong> {campus}</p>
                  <p><strong className="text-slate-900">Pickup:</strong> {pickupLocation}</p>
                  <p><strong className="text-slate-900">Hostel:</strong> {hostel}</p>
                  <p><strong className="text-slate-900">Seller:</strong> {sellerName} ({department}, {year})</p>
                  <p className="text-slate-500 italic border-l-2 border-emerald-600 pl-2">
                    "{description}"
                  </p>
                </div>
              </div>

              {/* Safety commitment checkbox */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  I confirm this item is in my possession on campus, matches the provided photos, and that I will meet buyers only in designated public campus areas.
                </span>
              </div>
            </div>
          )}

          {/* Wizard Controls Bottom Bar */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-full bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-7 py-3 rounded-full bg-[#15803D] hover:bg-[#064E3B] disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Uploading & Publishing...</span>
                  </>
                ) : !user ? (
                  <>
                    <Lock className="w-4 h-4 text-emerald-200" />
                    <span>Sign In to Publish</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#22C55E]" />
                    <span>Publish Listing to Supabase</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
