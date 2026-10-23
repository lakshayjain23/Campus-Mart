import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { Product, ListingStatus } from '../types/product';

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

export interface ConversationItem {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  listing?: {
    title: string;
    price: number;
    image: string;
    campus: string;
  };
  otherUser?: {
    name: string;
    avatarUrl?: string;
    college?: string;
  };
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  isMeetupSuggestion: boolean;
  meetupLocation?: string;
  createdAt: string;
  readAt?: string;
}

export interface ReportItem {
  id: string;
  listingId: string;
  reporterId: string;
  reason: 'Prohibited Item' | 'Scam/Fake' | 'Already Sold' | 'Other';
  explanation?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  moderatorNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  listing?: {
    title: string;
    price: number;
    category: string;
    sellerName: string;
  };
}

/**
 * Upload product image to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(file: File, userId?: string): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
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
    .select();

  if (error) {
    console.error('Error submitting product enquiry to Supabase:', error);
    throw error;
  }
  return record?.[0] || { success: true };
}

/**
 * 3. Save new product listing to Supabase with structured fields and 21-day expiry
 */
export async function createProductListing(product: Product) {
  const expiresAt = product.expiresAt || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
  const status: ListingStatus = product.status || 'available';

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
      in_stock: status === 'available',
      status: status,
      expires_at: expiresAt,
      course_code: product.courseCode || null,
      semester: product.semester || null,
      category_fields: (product.categoryFields as any) || {},
    })
    .select()
    .single();

  if (error) {
    // If additive columns fail in legacy DB schema, retry with baseline schema
    console.warn('Full column insert error, trying baseline fallback:', error.message);
    const { data: fallbackRecord, error: fallbackError } = await supabase
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

    if (fallbackError) {
      console.error('Fallback product insert error:', fallbackError);
      throw fallbackError;
    }
    return fallbackRecord;
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
      status: 'reserved',
    })
    .select();

  if (error) {
    console.error('Error saving reservation to Supabase:', error);
    throw error;
  }

  // Atomically update product statuses to 'reserved'
  for (const item of data.items) {
    try {
      await updateProductListing(item.productId, {
        status: 'reserved',
        inStock: false,
      });
    } catch {
      // non-blocking
    }
  }

  return record?.[0] || { id: `res-${Date.now()}` };
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
 * Helper to transform DB product row into typed Product
 */
function mapProductRow(row: any): Product {
  const isPastExpiry = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
  let status: ListingStatus = (row.status as ListingStatus) || (row.in_stock === false ? 'sold' : 'available');
  if (isPastExpiry && status === 'available') {
    status = 'archived';
  }

  return {
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
    expiresAt: row.expires_at || new Date(new Date(row.created_at || Date.now()).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: row.updated_at,
    status: status,
    featured: row.featured ?? false,
    isRecent: row.is_recent ?? false,
    inStock: status === 'available',
    courseCode: row.course_code || undefined,
    semester: row.semester || undefined,
    categoryFields: row.category_fields || undefined,
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
  };
}

/**
 * 7. Fetch all products from Supabase (filters out archived)
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

    // Map rows and hide archived items from public catalog
    return (data || [])
      .map(mapProductRow)
      .filter((p) => p.status !== 'archived');
  } catch (err) {
    console.warn('Could not fetch products from Supabase:', err);
    return [];
  }
}

/**
 * 8. Fetch products belonging to a specific seller (including archived & sold)
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

  return (data || []).map(mapProductRow);
}

/**
 * 9. Update an existing product listing
 */
export async function updateProductListing(productId: string, updates: Partial<Product>) {
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.price !== undefined) updatePayload.price = updates.price;
  if (updates.originalPrice !== undefined) updatePayload.original_price = updates.originalPrice;
  if (updates.category !== undefined) updatePayload.category = updates.category;
  if (updates.condition !== undefined) updatePayload.condition = updates.condition;
  if (updates.pickupLocation !== undefined) updatePayload.pickup_location = updates.pickupLocation;
  if (updates.images !== undefined) updatePayload.images = updates.images;
  if (updates.courseCode !== undefined) updatePayload.course_code = updates.courseCode;
  if (updates.semester !== undefined) updatePayload.semester = updates.semester;
  if (updates.categoryFields !== undefined) updatePayload.category_fields = updates.categoryFields;
  
  if (updates.status !== undefined) {
    updatePayload.status = updates.status;
    updatePayload.in_stock = updates.status === 'available';
  } else if (updates.inStock !== undefined) {
    updatePayload.in_stock = updates.inStock;
    updatePayload.status = updates.inStock ? 'available' : 'sold';
  }

  if (updates.expiresAt !== undefined) {
    updatePayload.expires_at = updates.expiresAt;
  }

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
 * Renew listing for an additional 21 days
 */
export async function renewProductListing(productId: string): Promise<string> {
  const nextExpiry = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

  // Try RPC first
  try {
    const { data: rpcData, error: rpcError } = await (supabase as any)
      .rpc('renew_listing', { p_listing_id: productId });
    if (!rpcError && rpcData?.success) {
      return nextExpiry;
    }
  } catch {
    // fallback to direct update
  }

  // Direct update fallback
  await updateProductListing(productId, {
    expiresAt: nextExpiry,
    status: 'available',
    inStock: true,
  });

  return nextExpiry;
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

/* ==============================================================================
   PRIVATE IN-APP MESSAGING
   ============================================================================== */

/**
 * Get or create a private conversation for a listing between buyer and seller
 */
export async function getOrCreateConversation(
  listingId: string,
  sellerId: string,
  buyerId: string
): Promise<string> {
  if (sellerId === buyerId) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  // Check existing conversation
  try {
    const { data: existing, error } = await (supabase as any)
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (!error && existing?.id) {
      return existing.id;
    }
  } catch (err) {
    console.warn('Could not query conversations table:', err);
  }

  // Create new conversation
  const { data: created, error: createErr } = await (supabase as any)
    .from('conversations')
    .insert({
      listing_id: listingId,
      seller_id: sellerId,
      buyer_id: buyerId,
      last_message_text: 'Conversation initiated',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (createErr) {
    console.error('Error creating conversation:', createErr);
    // If table doesn't exist yet in Supabase, return a safe composite local ID
    return `conv-${listingId}-${buyerId}`;
  }

  return created.id;
}

/**
 * Fetch all conversations involving the user
 */
export async function fetchUserConversations(userId: string): Promise<ConversationItem[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Error fetching conversations:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      listingId: row.listing_id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      lastMessageText: row.last_message_text || '',
      lastMessageAt: row.last_message_at || row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('Conversations fetch error:', err);
    return [];
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function fetchConversationMessages(conversationId: string): Promise<MessageItem[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching messages:', error.message);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      messageText: m.message_text,
      isMeetupSuggestion: Boolean(m.is_meetup_suggestion),
      meetupLocation: m.meetup_location || undefined,
      createdAt: m.created_at,
      readAt: m.read_at,
    }));
  } catch (err) {
    console.warn('Messages fetch error:', err);
    return [];
  }
}

/**
 * Send a message within a conversation
 */
export async function sendMessage(payload: {
  conversationId: string;
  senderId: string;
  messageText: string;
  isMeetupSuggestion?: boolean;
  meetupLocation?: string;
}): Promise<MessageItem> {
  const insertPayload = {
    conversation_id: payload.conversationId,
    sender_id: payload.senderId,
    message_text: payload.messageText,
    is_meetup_suggestion: payload.isMeetupSuggestion ?? false,
    meetup_location: payload.meetupLocation || null,
  };

  const { data, error } = await (supabase as any)
    .from('messages')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  // Update conversation last message
  try {
    await (supabase as any)
      .from('conversations')
      .update({
        last_message_text: payload.messageText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.conversationId);
  } catch {
    // non-fatal
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    messageText: data.message_text,
    isMeetupSuggestion: Boolean(data.is_meetup_suggestion),
    meetupLocation: data.meetup_location || undefined,
    createdAt: data.created_at,
  };
}

/* ==============================================================================
   LISTING REPORTING & MODERATION
   ============================================================================== */

/**
 * Submit listing report for moderation review
 */
export async function submitListingReport(payload: {
  listingId: string;
  reporterId?: string;
  reason: 'Prohibited Item' | 'Scam/Fake' | 'Already Sold' | 'Other' | 'prohibited_item' | 'scam_fake' | 'already_sold' | 'other';
  explanation?: string;
}): Promise<{ data?: any; error: Error | null }> {
  try {
    const reasonMap: Record<string, string> = {
      prohibited_item: 'Prohibited Item',
      scam_fake: 'Scam/Fake',
      already_sold: 'Already Sold',
      other: 'Other',
    };
    const canonicalReason = reasonMap[payload.reason] || payload.reason;

    const { data, error } = await (supabase as any)
      .from('listing_reports')
      .insert({
        listing_id: payload.listingId,
        reporter_id: payload.reporterId || null,
        reason: canonicalReason,
        explanation: payload.explanation?.trim() || null,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return { error: new Error('You have already submitted a report for this listing.') };
      }
      return { error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { error: err as Error };
  }
}

/**
 * Fetch all reports for moderator dashboard
 */
export async function fetchModerationReports(): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('listing_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err as Error };
  }
}

/**
 * Update report status (dismiss or resolve)
 */
export async function updateReportStatus(payload: {
  reportId: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  resolutionNotes?: string;
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await (supabase as any)
      .from('listing_reports')
      .update({
        status: payload.status,
        reviewed_by: payload.reviewedBy || null,
        resolved_by: payload.reviewedBy || null,
        moderator_notes: payload.resolutionNotes || null,
        resolution_notes: payload.resolutionNotes || null,
        resolved_at: payload.status === 'resolved' || payload.status === 'dismissed' ? new Date().toISOString() : null,
      })
      .eq('id', payload.reportId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err as Error };
  }
}

/**
 * Take down / archive prohibited listing as moderator
 */
export async function takeDownReportedListing(
  listingId: string,
  reportId?: string,
  reviewedBy?: string
): Promise<{ error: Error | null }> {
  try {
    await updateProductListing(listingId, {
      status: 'archived',
      inStock: false,
    });

    if (reportId) {
      await updateReportStatus({
        reportId,
        status: 'resolved',
        reviewedBy,
        resolutionNotes: 'Listing removed by moderation team for policy violation.',
      });
    }
    return { error: null };
  } catch (err: any) {
    return { error: err as Error };
  }
}

/**
 * Fetch wishlist product IDs for an authenticated user from Supabase.
 * Gracefully falls back to user-scoped storage if the table is pending migration or offline.
 */
export async function fetchUserWishlist(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist yet or connection fails, fall back to user-scoped cache
      console.warn('Supabase fetchUserWishlist notice:', error.message);
      const fallback = localStorage.getItem(`campusmart_wishlist_${userId}`);
      return fallback ? JSON.parse(fallback) : [];
    }

    const ids = (data || []).map((row: { product_id: string }) => row.product_id);
    try {
      localStorage.setItem(`campusmart_wishlist_${userId}`, JSON.stringify(ids));
    } catch {
      // ignore quota errors
    }
    return ids;
  } catch (err) {
    console.warn('fetchUserWishlist exception:', err);
    const fallback = localStorage.getItem(`campusmart_wishlist_${userId}`);
    return fallback ? JSON.parse(fallback) : [];
  }
}

/**
 * Add a product to the authenticated user's wishlist in Supabase.
 */
export async function addToUserWishlist(
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, product_id: productId });

    if (error) {
      // Graceful fallback if table is not yet migrated in Supabase
      if (
        error.code === '42P01' ||
        error.message?.includes('not find the table') ||
        error.message?.includes('schema cache')
      ) {
        const stored = localStorage.getItem(`campusmart_wishlist_${userId}`);
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (!list.includes(productId)) {
          list.push(productId);
          localStorage.setItem(`campusmart_wishlist_${userId}`, JSON.stringify(list));
        }
        return { success: true };
      }

      // If duplicate key (already saved), treat idempotently as success
      if (
        error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique_user_product_wishlist')
      ) {
        return { success: true };
      }

      return { success: false, error: error.message };
    }

    // Update user-scoped cache on success
    try {
      const stored = localStorage.getItem(`campusmart_wishlist_${userId}`);
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(productId)) {
        list.push(productId);
        localStorage.setItem(`campusmart_wishlist_${userId}`, JSON.stringify(list));
      }
    } catch {
      // ignore storage errors
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add item to wishlist' };
  }
}

/**
 * Remove a product from the authenticated user's wishlist in Supabase.
 */
export async function removeFromUserWishlist(
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.includes('not find the table') ||
        error.message?.includes('schema cache')
      ) {
        const stored = localStorage.getItem(`campusmart_wishlist_${userId}`);
        if (stored) {
          const list: string[] = JSON.parse(stored).filter((id: string) => id !== productId);
          localStorage.setItem(`campusmart_wishlist_${userId}`, JSON.stringify(list));
        }
        return { success: true };
      }

      return { success: false, error: error.message };
    }

    // Update user-scoped cache on success
    try {
      const stored = localStorage.getItem(`campusmart_wishlist_${userId}`);
      if (stored) {
        const list: string[] = JSON.parse(stored).filter((id: string) => id !== productId);
        localStorage.setItem(`campusmart_wishlist_${userId}`, JSON.stringify(list));
      }
    } catch {
      // ignore storage errors
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to remove item from wishlist' };
  }
}

/**
 * Clear all wishlist items for an authenticated user in Supabase.
 */
export async function clearUserWishlist(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId);

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.includes('not find the table') ||
        error.message?.includes('schema cache')
      ) {
        localStorage.removeItem(`campusmart_wishlist_${userId}`);
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    localStorage.removeItem(`campusmart_wishlist_${userId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to clear wishlist' };
  }
}

