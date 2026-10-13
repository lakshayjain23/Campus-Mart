import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { Product } from '../types/product';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface ContactInquiryPayload {
  name: string;
  email: string;
  college?: string;
  subject: string;
  message: string;
}

export interface ProductEnquiryPayload {
  productId: string;
  productTitle: string;
  productPrice?: number;
  sellerId?: string;
  sellerName?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  message: string;
  preferredMeetup?: string;
  shareContactConsent?: boolean;
}

export interface ReservationPayload {
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    pickupLocation?: string;
    sellerName?: string;
  }>;
  totalAmount: number;
  campus?: string;
  pickupSlot: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

/**
 * Upload product image to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(file: File, userId?: string): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WEBP)');
  }

  // Max 8MB
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image size must be less than 8MB');
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId || 'public'}/${Date.now()}-${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image to Supabase Storage:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * 1. Submit general contact & support inquiry
 */
export async function submitContactInquiry(data: ContactInquiryPayload) {
  const { error } = await supabase
    .from('contact_inquiries')
    .insert({
      name: data.name,
      email: data.email,
      college: data.college || null,
      subject: data.subject,
      message: data.message,
    });

  if (error) {
    console.error('Error submitting contact inquiry to Supabase:', error);
    throw error;
  }
  return { success: true };
}

/**
 * 2. Submit product specific inquiry from modal
 */
export async function submitProductEnquiry(data: ProductEnquiryPayload) {
  const { data: record, error } = await supabase
    .from('product_enquiries')
    .insert({
      product_id: data.productId,
      product_title: data.productTitle,
      product_price: data.productPrice ?? null,
      seller_id: data.sellerId || null,
      seller_name: data.sellerName || null,
      buyer_id: data.buyerId || null,
      buyer_name: data.buyerName || null,
      buyer_email: data.buyerEmail || null,
      message: data.message,
      preferred_meetup: data.preferredMeetup || null,
      share_contact_consent: data.shareContactConsent ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting product enquiry to Supabase:', error);
    throw error;
  }
  return record;
}

/**
 * 3. Save new product listing to Supabase
 */
export async function createProductListing(product: Product) {
  const { data: record, error } = await supabase
    .from('products')
    .insert({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      original_price: product.originalPrice ?? null,
      category: product.category,
      condition: product.condition,
      images: product.images,
      campus: product.campus,
      pickup_location: product.pickupLocation,
      seller_id: product.seller.id,
      seller_name: product.seller.name,
      seller_department: product.seller.department,
      seller_year: product.seller.year,
      seller_hostel: product.seller.hostel,
      seller_rating: product.seller.rating,
      seller_reviews_count: product.seller.reviewsCount,
      seller_verified: product.seller.verifiedStudent,
      seller_avatar_url: product.seller.avatarUrl,
      seller_response_time: product.seller.responseTime,
      tags: product.tags,
      featured: product.featured ?? false,
      is_recent: product.isRecent ?? true,
      in_stock: product.inStock ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving product to Supabase:', error);
    throw error;
  }
  return record;
}

/**
 * 4. Submit cart reservation / order to Supabase
 */
export async function submitReservation(data: ReservationPayload) {
  const { data: record, error } = await supabase
    .from('reservations')
    .insert({
      items: data.items,
      total_amount: data.totalAmount,
      campus: data.campus || null,
      pickup_slot: data.pickupSlot,
      buyer_id: data.buyerId || null,
      buyer_name: data.buyerName || null,
      buyer_email: data.buyerEmail || null,
      buyer_phone: data.buyerPhone || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving reservation to Supabase:', error);
    throw error;
  }
  return record;
}

/**
 * 5. Add custom campus to Supabase
 */
export async function addCampusToBackend(campusName: string) {
  const { data: record, error } = await supabase
    .from('campuses')
    .insert({ name: campusName })
    .select()
    .single();

  if (error && error.code !== '23505') {
    console.error('Error adding campus to Supabase:', error);
  }
  return record;
}

/**
 * 6. Fetch campuses from Supabase
 */
export async function fetchCampusesFromBackend(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('campuses')
      .select('name')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not fetch campuses from Supabase, using local defaults:', error.message);
      return [];
    }
    return data?.map((c) => c.name) || [];
  } catch (err) {
    console.warn('Could not fetch campuses from Supabase:', err);
    return [];
  }
}

/**
 * 7. Fetch all products from Supabase
 */
export async function fetchProductsFromBackend(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch products from Supabase:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      category: row.category,
      condition: row.condition as any,
      images: row.images || [],
      campus: row.campus,
      pickupLocation: row.pickup_location,
      tags: row.tags || [],
      createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      featured: row.featured ?? false,
      isRecent: row.is_recent ?? false,
      inStock: row.in_stock ?? true,
      seller: {
        id: row.seller_id || `seller-${row.id}`,
        name: row.seller_name,
        department: row.seller_department || '',
        year: row.seller_year || '',
        hostel: row.seller_hostel || '',
        rating: row.seller_rating ? Number(row.seller_rating) : 5.0,
        reviewsCount: row.seller_reviews_count || 1,
        verifiedStudent: row.seller_verified ?? true,
        avatarUrl: row.seller_avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        responseTime: row.seller_response_time || 'Under 30 mins',
        campus: row.campus,
      },
    }));
  } catch (err) {
    console.warn('Could not fetch products from Supabase:', err);
    return [];
  }
}

/**
 * 8. Fetch products belonging to a specific seller
 */
export async function fetchSellerProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    category: row.category,
    condition: row.condition as any,
    images: row.images || [],
    campus: row.campus,
    pickupLocation: row.pickup_location,
    tags: row.tags || [],
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    featured: row.featured ?? false,
    isRecent: row.is_recent ?? false,
    inStock: row.in_stock ?? true,
    seller: {
      id: row.seller_id || sellerId,
      name: row.seller_name,
      department: row.seller_department || '',
      year: row.seller_year || '',
      hostel: row.seller_hostel || '',
      rating: row.seller_rating ? Number(row.seller_rating) : 5.0,
      reviewsCount: row.seller_reviews_count || 1,
      verifiedStudent: row.seller_verified ?? true,
      avatarUrl: row.seller_avatar_url || '',
      responseTime: row.seller_response_time || 'Under 30 mins',
      campus: row.campus,
    },
  }));
}

/**
 * 9. Update an existing product listing
 */
export async function updateProductListing(productId: string, updates: Partial<Product>) {
  const updatePayload: any = {};
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.price !== undefined) updatePayload.price = updates.price;
  if (updates.originalPrice !== undefined) updatePayload.original_price = updates.originalPrice;
  if (updates.category !== undefined) updatePayload.category = updates.category;
  if (updates.condition !== undefined) updatePayload.condition = updates.condition;
  if (updates.inStock !== undefined) updatePayload.in_stock = updates.inStock;
  if (updates.pickupLocation !== undefined) updatePayload.pickup_location = updates.pickupLocation;
  if (updates.images !== undefined) updatePayload.images = updates.images;

  const { error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId);

  if (error) {
    console.error('Error updating product listing:', error);
    throw error;
  }
}

/**
 * 10. Delete a product listing
 */
export async function deleteProductListing(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product listing:', error);
    throw error;
  }
}

/**
 * 11. Fetch reservations for buyer
 */
export async function fetchUserReservations(buyerId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reservations:', error);
    throw error;
  }
  return data || [];
}

/**
 * 12. Fetch enquiries sent by buyer
 */
export async function fetchUserSentEnquiries(buyerId: string) {
  const { data, error } = await supabase
    .from('product_enquiries')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sent enquiries:', error);
    throw error;
  }
  return data || [];
}

/**
 * 13. Fetch enquiries received by seller
 */
export async function fetchSellerReceivedEnquiries(sellerId: string) {
  const { data, error } = await supabase
    .from('product_enquiries')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching received enquiries:', error);
    throw error;
  }
  return data || [];
}
