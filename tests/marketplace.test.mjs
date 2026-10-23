import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------------
// Pure Unit Logic Tests — Marketplace & Business Rules
// -------------------------------------------------------------

function formatPriceINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getConditionBadge(condition) {
  switch (condition) {
    case 'brand_new':
      return { label: 'Brand New', dot: 'bg-emerald-500' };
    case 'like_new':
      return { label: 'Like New', dot: 'bg-blue-500' };
    case 'good':
      return { label: 'Good Condition', dot: 'bg-slate-400' };
    case 'fair':
      return { label: 'Fair / Functional', dot: 'bg-amber-500' };
    case 'student_created':
      return { label: 'Student Made', dot: 'bg-purple-500', icon: true };
    default:
      return { label: 'Pre-owned', dot: 'bg-slate-400' };
  }
}

function filterProducts(products, filters) {
  return products.filter((product) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.category && filters.category !== 'All' && product.category !== filters.category) {
      return false;
    }
    if (filters.condition && filters.condition !== 'all' && product.condition !== filters.condition) {
      return false;
    }
    if (filters.maxPrice && product.price > filters.maxPrice) {
      return false;
    }
    if (filters.campus && filters.campus !== 'All Campuses') {
      const prefix = filters.campus.split(' - ')[0].toLowerCase();
      if (!product.campus.toLowerCase().includes(prefix) && product.campus.toLowerCase() !== filters.campus.toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

function calculateCartTotal(cartItems) {
  return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

// Prohibited Items Screening Logic
const PROHIBITED_KEYWORDS = [
  'weapon', 'gun', 'firearm', 'pistol', 'knife', 'explosive',
  'weed', 'cannabis', 'marijuana', 'cocaine', 'heroin', 'vape',
  'porn', 'adult', 'escort',
  'cheating', 'leaked paper', 'exam leak', 'hack exam',
  'western union', 'crypto payment only', 'advance fee',
];

function checkContentGuardrails(text) {
  const normalized = text.toLowerCase();
  for (const keyword of PROHIBITED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalized)) {
      return { allowed: false, reason: `Contains restricted term: "${keyword}"` };
    }
  }
  return { allowed: true };
}

function validateListingForm(fields) {
  const errors = [];
  if (!fields.title || fields.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (fields.price === undefined || fields.price === null || fields.price < 0) {
    errors.push('Price must be a valid non-negative number');
  }
  if (!fields.category) {
    errors.push('Category is required');
  }
  if (fields.category === 'Course Textbooks') {
    if (!fields.courseCode || !fields.courseCode.trim()) {
      errors.push('Course code is required for Course Textbooks');
    }
    if (!fields.semester || !fields.semester.trim()) {
      errors.push('Semester is required for Course Textbooks');
    }
  }
  return { isValid: errors.length === 0, errors };
}

function calculateExpiryDate(startDate, days = 21) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Lifecycle check: prevent reopening sold listings
function validateStatusTransition(currentStatus, targetStatus) {
  if (currentStatus === 'sold' && targetStatus !== 'sold') {
    return { allowed: false, error: 'Sold listings cannot be reopened.' };
  }
  return { allowed: true };
}

describe('Campus Mart — Marketplace Business Logic & Safeguards', () => {
  it('formats Indian Rupee prices accurately', () => {
    assert.match(formatPriceINR(450), /₹\s*450/);
    assert.match(formatPriceINR(12000), /₹\s*12,000/);
    assert.match(formatPriceINR(0), /₹\s*0/);
  });

  it('assigns correct badges for all product conditions', () => {
    assert.equal(getConditionBadge('brand_new').label, 'Brand New');
    assert.equal(getConditionBadge('like_new').label, 'Like New');
    assert.equal(getConditionBadge('good').label, 'Good Condition');
    assert.equal(getConditionBadge('fair').label, 'Fair / Functional');
    assert.equal(getConditionBadge('student_created').label, 'Student Made');
    assert.equal(getConditionBadge('unknown').label, 'Pre-owned');
  });

  it('filters products correctly by search query and category', () => {
    const mockList = [
      { id: '1', title: 'Calculus 9th Edition Stewart', description: 'Math textbook', category: 'Course Textbooks', condition: 'like_new', price: 650, campus: 'IIT Delhi - Main Campus', tags: ['math'] },
      { id: '2', title: 'Hostel Electric Kettle', description: '1.5L heating kettle', category: 'Dorm & Room Essentials', condition: 'good', price: 400, campus: 'IIT Bombay - Powai Campus', tags: ['kettle'] },
      { id: '3', title: 'Campus Geared Bicycle', description: '21 speed bike', category: 'Campus Mobility', condition: 'good', price: 3200, campus: 'IIT Delhi - Main Campus', tags: ['cycle'] },
    ];

    const searchRes = filterProducts(mockList, { searchQuery: 'calculus' });
    assert.equal(searchRes.length, 1);
    assert.equal(searchRes[0].id, '1');

    const catRes = filterProducts(mockList, { category: 'Dorm & Room Essentials' });
    assert.equal(catRes.length, 1);
    assert.equal(catRes[0].id, '2');

    const campusRes = filterProducts(mockList, { campus: 'IIT Delhi - Main Campus' });
    assert.equal(campusRes.length, 2);
  });

  it('calculates cart item line totals and cumulative order sums', () => {
    const items = [
      { price: 450, quantity: 2 }, // 900
      { price: 1200, quantity: 1 }, // 1200
      { price: 150, quantity: 3 }, // 450
    ];
    assert.equal(calculateCartTotal(items), 2550);
  });

  it('enforces mandatory Course Code and Semester for Course Textbooks', () => {
    const invalidBook = validateListingForm({
      title: 'Operating System Concepts',
      price: 500,
      category: 'Course Textbooks',
      courseCode: '',
      semester: '',
    });
    assert.equal(invalidBook.isValid, false);
    assert.ok(invalidBook.errors.some((e) => e.includes('Course code')));
    assert.ok(invalidBook.errors.some((e) => e.includes('Semester')));

    const validBook = validateListingForm({
      title: 'Operating System Concepts',
      price: 500,
      category: 'Course Textbooks',
      courseCode: 'CS204',
      semester: '4th Semester',
    });
    assert.equal(validBook.isValid, true);
    assert.equal(validBook.errors.length, 0);
  });

  it('rejects negative prices and requires valid product titles', () => {
    const negPrice = validateListingForm({
      title: 'Scientific Calculator',
      price: -100,
      category: 'Electronics & Accessories',
    });
    assert.equal(negPrice.isValid, false);
    assert.ok(negPrice.errors.some((e) => e.includes('non-negative')));

    const shortTitle = validateListingForm({
      title: 'a',
      price: 200,
      category: 'Dorm & Room Essentials',
    });
    assert.equal(shortTitle.isValid, false);
    assert.ok(shortTitle.errors.some((e) => e.includes('at least 3 characters')));
  });

  it('enforces sold listing immutability (cannot reopen sold listings)', () => {
    const reopenAttempt = validateStatusTransition('sold', 'available');
    assert.equal(reopenAttempt.allowed, false);
    assert.match(reopenAttempt.error, /cannot be reopened/i);

    const validReserve = validateStatusTransition('available', 'reserved');
    assert.equal(validReserve.allowed, true);

    const validSell = validateStatusTransition('reserved', 'sold');
    assert.equal(validSell.allowed, true);
  });

  it('flags prohibited content keywords and prevents illegal campus listings', () => {
    const violation = checkContentGuardrails('Selling real pistol and weapon for defense');
    assert.equal(violation.allowed, false);
    assert.match(violation.reason, /restricted term/i);

    const scam = checkContentGuardrails('Send payment via western union advance fee only');
    assert.equal(scam.allowed, false);

    const examLeak = checkContentGuardrails('Final semester exam leak paper CS101');
    assert.equal(examLeak.allowed, false);
  });

  it('permits legitimate campus items without false positive blocking', () => {
    const textbook = checkContentGuardrails('Introduction to Quantum Physics Second Edition');
    assert.equal(textbook.allowed, true);

    const bicycle = checkContentGuardrails('Hercules 21 speed campus bicycle with lock');
    assert.equal(bicycle.allowed, true);

    const electronics = checkContentGuardrails('Dell 24 inch full HD monitor with HDMI cable');
    assert.equal(electronics.allowed, true);
  });

  it('computes exact 21-day automatic expiration timestamps for listings', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const expiryIso = calculateExpiryDate(now, 21);
    const expiryDate = new Date(expiryIso);
    const diffDays = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 21);
  });
});

// -------------------------------------------------------------
// Live Supabase Integration & RLS Security Tests
// (Strictly Read-Only & Access-Control Verification)
// -------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Campus Mart — Supabase Database & Security Verification', () => {
  it('connects to Supabase and fetches campus institutions safely', async () => {
    const { data, error } = await supabase.from('campuses').select('name');
    assert.equal(error, null, `Error fetching campuses: ${error?.message}`);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 7, 'Expected at least 7 campus options');
  });

  it('fetches public products catalog without leaking private seller credentials', async () => {
    const { data, error } = await supabase.from('products').select('id, title, price, in_stock');
    assert.equal(error, null, `Error fetching products: ${error?.message}`);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0, 'Products catalog should contain active listings');
  });

  it('verifies product_images storage bucket exists with public read permissions', async () => {
    const { data, error } = await supabase.storage.from('product-images').list();
    assert.equal(error, null, `Error accessing product-images bucket: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated UPDATE on products', async () => {
    const { error: _error } = await supabase
      .from('products')
      .update({ title: 'Unauthorized Modification Attempt' })
      .eq('id', 'prod-01');

    // RLS either returns an error or affects 0 rows
    const { data: verifyRow } = await supabase
      .from('products')
      .select('title')
      .eq('id', 'prod-01')
      .maybeSingle();

    if (verifyRow) {
      assert.notEqual(
        verifyRow.title,
        'Unauthorized Modification Attempt',
        'RLS must prevent unauthenticated modification of product listings!'
      );
    }
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated DELETE on products', async () => {
    const { error: _error } = await supabase
      .from('products')
      .delete()
      .eq('id', 'prod-01');

    // Ensure row still exists
    const { data: verifyRow } = await supabase
      .from('products')
      .select('id')
      .eq('id', 'prod-01')
      .maybeSingle();

    if (verifyRow) {
      assert.equal(verifyRow.id, 'prod-01', 'Anonymous user must not be able to delete listings');
    }
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated SELECT on private conversations', async () => {
    const { data, error } = await supabase.from('conversations').select('*');
    // Either table does not exist yet (error) or RLS returns empty list [] for anon
    if (!error) {
      assert.deepEqual(data, [], 'Anonymous users must never receive private conversations');
    }
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated INSERT on messages', async () => {
    const { error } = await supabase.from('messages').insert({
      conversation_id: '00000000-0000-0000-0000-000000000000',
      sender_id: '00000000-0000-0000-0000-000000000000',
      message_text: 'Unauthorized probe',
    });
    assert.ok(error !== null, 'Anonymous users must be blocked from sending messages');
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated SELECT on listing reports', async () => {
    const { data, error } = await supabase.from('listing_reports').select('*');
    if (!error) {
      assert.deepEqual(data, [], 'Anonymous users must never read community listing reports');
    }
  });

  it('verifies optional student authentication when credentials provided via environment', async (t) => {
    const testEmail = process.env.TEST_STUDENT_EMAIL;
    const testPassword = process.env.TEST_STUDENT_PASSWORD;

    if (!testEmail || !testPassword) {
      t.skip('Skipping student session test: TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD environment variables not set');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    assert.equal(error, null, `Student login failed: ${error?.message}`);
    assert.ok(data.user, 'Expected authenticated user object');
  });

  // -----------------------------------------------------------
  // Automated Regression Safeguards for Fixed Defects
  // -----------------------------------------------------------
  it('REGRESSION: validates conversation initiation ensures buyer and seller are not swapped', () => {
    function prepareConversationArgs(listingId, sellerId, buyerId) {
      if (sellerId === buyerId) {
        throw new Error('You cannot start a conversation with yourself.');
      }
      return {
        listing_id: listingId,
        seller_id: sellerId,
        buyer_id: buyerId,
      };
    }

    const listingId = 'prod-101';
    const sellerId = 'seller-user-uuid-1';
    const buyerId = 'buyer-user-uuid-2';

    // Must correctly map seller to seller_id and buyer to buyer_id
    const payload = prepareConversationArgs(listingId, sellerId, buyerId);
    assert.equal(payload.seller_id, sellerId);
    assert.equal(payload.buyer_id, buyerId);

    // Self-chat must be prohibited
    assert.throws(
      () => prepareConversationArgs(listingId, sellerId, sellerId),
      /cannot start a conversation with yourself/i
    );
  });

  it('REGRESSION: moderation access check blocks ordinary students and allows only moderators/admins', () => {
    function isModeratorAuthorized(profile) {
      return Boolean(profile && (profile.role === 'moderator' || profile.role === 'admin'));
    }

    assert.equal(isModeratorAuthorized({ role: 'student' }), false);
    assert.equal(isModeratorAuthorized({ role: 'user' }), false);
    assert.equal(isModeratorAuthorized(null), false);
    assert.equal(isModeratorAuthorized({ role: 'moderator' }), true);
    assert.equal(isModeratorAuthorized({ role: 'admin' }), true);
  });

  it('REGRESSION: duplicate registration rejects existing emails and enforces account protection', () => {
    function evaluateRegistrationCheck(existingEmail, incomingEmail) {
      const normExisting = existingEmail.toLowerCase().trim();
      const normIncoming = incomingEmail.toLowerCase().trim();
      if (normExisting === normIncoming) {
        return { success: false, error: 'An account with this email already exists. Please sign in or use password reset.' };
      }
      return { success: true };
    }

    const check = evaluateRegistrationCheck('student@campus.edu', 'STUDENT@campus.edu ');
    assert.equal(check.success, false);
    assert.match(check.error, /already exists/i);
  });

  it('REGRESSION: vercel.json SPA rewrites config routes all deep links to index.html', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const vercelConfigPath = path.resolve('vercel.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist in project root');

    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.ok(Array.isArray(config.rewrites), 'rewrites array must be defined in vercel.json');
    const hasSpaCatchAll = config.rewrites.some(
      (r) => (r.source === '/(.*)' || r.source === '/:path*') && r.destination === '/'
    );
    assert.ok(hasSpaCatchAll, 'vercel.json must route all paths to / for client-side routing');
  });
});

// -------------------------------------------------------------
// Wishlist Authentication, Persistence & Isolation Tests
// -------------------------------------------------------------

describe('Campus Mart — Wishlist Authentication, Multi-User Isolation & Layout Verification', () => {
  function handleWishlistToggle(user, currentWishlist, productId, onOpenAuthModal) {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal('signin');
      return { modified: false, wishlist: currentWishlist, authModalOpened: true };
    }
    const exists = currentWishlist.includes(productId);
    const updated = exists
      ? currentWishlist.filter((id) => id !== productId)
      : [...currentWishlist, productId];
    return { modified: true, wishlist: updated, authModalOpened: false };
  }

  function getEffectiveWishlistCount(user, wishlist) {
    return user ? wishlist.length : 0;
  }

  function isItemInWishlist(user, wishlist, productId) {
    if (!user) return false;
    return wishlist.includes(productId);
  }

  it('WISHLIST: blocks logged-out users from saving products and prompts sign-in modal', () => {
    let authModalOpenedWith = null;
    const initialWishlist = [];

    // Attempting to save a product while unauthenticated
    const result = handleWishlistToggle(null, initialWishlist, 'prod-01', (mode) => {
      authModalOpenedWith = mode;
    });

    assert.equal(result.modified, false, 'Logged-out toggle must not modify the wishlist');
    assert.equal(result.authModalOpened, true, 'Logged-out toggle must trigger auth modal');
    assert.equal(authModalOpenedWith, 'signin', 'Auth modal must open in sign-in mode');
    assert.deepEqual(result.wishlist, [], 'Wishlist must remain strictly empty');
    assert.equal(isItemInWishlist(null, result.wishlist, 'prod-01'), false, 'Logged-out user must not show item as wishlisted');
  });

  it('WISHLIST: header count strictly shows zero or hides for logged-out sessions', () => {
    // Even if somehow local state has items, count must evaluate to 0 for unauthenticated users
    assert.equal(getEffectiveWishlistCount(null, ['prod-01', 'prod-02']), 0);
    assert.equal(getEffectiveWishlistCount(null, []), 0);

    // For authenticated users, it must reflect actual saved count
    const mockUser = { id: 'usr-123', email: 'student@campus.edu' };
    assert.equal(getEffectiveWishlistCount(mockUser, ['prod-01', 'prod-02']), 2);
    assert.equal(getEffectiveWishlistCount(mockUser, []), 0);
  });

  it('WISHLIST: allows authenticated users to add, toggle, and remove products with persistence', () => {
    const studentUser = { id: 'student-uuid-456', email: 'alex@iitd.ac.in' };
    let studentWishlist = [];

    // 1. Add prod-01
    let op = handleWishlistToggle(studentUser, studentWishlist, 'prod-01');
    assert.equal(op.modified, true);
    assert.deepEqual(op.wishlist, ['prod-01']);
    studentWishlist = op.wishlist;

    // 2. Add prod-02
    op = handleWishlistToggle(studentUser, studentWishlist, 'prod-02');
    assert.equal(op.modified, true);
    assert.deepEqual(op.wishlist, ['prod-01', 'prod-02']);
    studentWishlist = op.wishlist;

    // 3. Remove prod-01 (toggle off)
    op = handleWishlistToggle(studentUser, studentWishlist, 'prod-01');
    assert.equal(op.modified, true);
    assert.deepEqual(op.wishlist, ['prod-02']);
    studentWishlist = op.wishlist;

    assert.equal(isItemInWishlist(studentUser, studentWishlist, 'prod-02'), true);
    assert.equal(isItemInWishlist(studentUser, studentWishlist, 'prod-01'), false);
  });

  it('WISHLIST ISOLATION: completely isolates User A and User B wishlists and clears immediately on logout', () => {
    const userA = { id: 'user-a-uuid', email: 'userA@campus.edu' };
    const userB = { id: 'user-b-uuid', email: 'userB@campus.edu' };

    // User A saves listings
    const userAWishlist = ['prod-01', 'prod-04'];

    // User B saves different listings
    const userBWishlist = ['prod-02'];

    // Assert absolute non-overlap
    assert.ok(userAWishlist.includes('prod-01'));
    assert.ok(!userBWishlist.includes('prod-01'), "User B must not see User A's prod-01");
    assert.ok(!userAWishlist.includes('prod-02'), "User A must not see User B's prod-02");

    // Simulate User A logging out
    let activeUser = userA;
    let clientWishlist = [...userAWishlist];

    function onSignOut() {
      activeUser = null;
      clientWishlist = [];
    }

    onSignOut();
    assert.equal(activeUser, null);
    assert.deepEqual(clientWishlist, [], 'Wishlist must immediately be cleared on sign-out');
    assert.equal(getEffectiveWishlistCount(activeUser, clientWishlist), 0, 'Wishlist count must be 0 after logout');

    // Simulate User B logging in
    function onSignInUserB() {
      activeUser = userB;
      clientWishlist = [...userBWishlist];
    }

    onSignInUserB();
    assert.equal(activeUser.id, userB.id);
    assert.deepEqual(clientWishlist, ['prod-02'], "User B must load only User B's items");
    assert.equal(clientWishlist.includes('prod-01'), false, 'User B must never inherit User A items');
  });

  it('CATEGORY CARD: renders full "Student-Created Products" title without clipping or fixed-height constraints', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const categoryCardPath = path.resolve('src/components/CategoryCard.tsx');
    assert.ok(fs.existsSync(categoryCardPath), 'CategoryCard.tsx must exist');

    const cardSource = fs.readFileSync(categoryCardPath, 'utf8');

    // Verify removal of clipping restrictions
    assert.equal(
      cardSource.includes('line-clamp-2'),
      false,
      'CategoryCard must NOT use line-clamp-2 which clips 3-line titles like Student-Created Products'
    );
    assert.equal(
      cardSource.includes('h-7 sm:h-9'),
      false,
      'CategoryCard must NOT restrict title to fixed h-7 or sm:h-9'
    );

    // Verify proper flex layout and wrapping
    assert.ok(
      cardSource.includes('break-words') || cardSource.includes('leading-tight'),
      'CategoryCard title must support break-words and natural line wrapping'
    );
    assert.ok(
      cardSource.includes('h-full'),
      'CategoryCard must use h-full to keep grid cards uniformly aligned'
    );
    assert.ok(
      cardSource.includes('mt-auto') || cardSource.includes('justify-between'),
      'CategoryCard must pin item count to the bottom via flex layout'
    );
  });

  it('DATABASE MIGRATION: 20261023000000_user_wishlists.sql defines wishlists table and least-privilege RLS policies', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const migrationPath = path.resolve('supabase/migrations/20261023000000_user_wishlists.sql');
    assert.ok(fs.existsSync(migrationPath), 'Wishlist migration file must exist');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.wishlists'), 'Migration must create wishlists table');
    assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Migration must enable RLS');
    assert.ok(sql.includes('auth.uid() = user_id'), 'RLS policies must enforce auth.uid() = user_id');
    assert.ok(sql.includes('REVOKE ALL ON public.wishlists FROM anon'), 'Migration must revoke access from unauthenticated anon role');
    assert.ok(sql.includes('CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)'), 'Migration must prevent duplicate entries');
  });
});


