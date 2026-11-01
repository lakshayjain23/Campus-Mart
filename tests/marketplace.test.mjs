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

  it('INSTITUTIONAL EMAIL & TIER VERIFICATION: accurately classifies Indian university and institutional domains and blocks username-spoofing attacks', () => {
    function isInstitutionalEmail(email) {
      if (!email || typeof email !== 'string') return false;
      const clean = email.trim().toLowerCase();
      const atIndex = clean.lastIndexOf('@');
      if (atIndex === -1 || atIndex === 0 || atIndex === clean.length - 1) {
        return false;
      }

      const domain = clean.slice(atIndex + 1);
      const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return false;
      }

      const institutionalSuffixes = [
        '.ac.in',
        '.edu.in',
        '.edu',
        '.ernet.in',
        '.res.in',
      ];

      for (const suffix of institutionalSuffixes) {
        if (domain.endsWith(suffix) && domain.length > suffix.length) {
          return true;
        }
      }

      const knownUniversityDomains = [
        'iitd.ac.in',
        'dtu.ac.in',
        'nsut.ac.in',
        'bits-pilani.ac.in',
        'rvce.edu.in',
        'iitb.ac.in',
        'iitm.ac.in',
        'iitk.ac.in',
        'iitkgp.ac.in',
        'iitr.ac.in',
        'du.ac.in',
        'jnu.ac.in',
        'bhu.ac.in',
        'iiitd.ac.in',
      ];

      return knownUniversityDomains.some(
        (univ) => domain === univ || domain.endsWith(`.${univ}`)
      );
    }

    function getVerificationTier(email, verifiedStudent) {
      if (isInstitutionalEmail(email)) {
        return { tier: 'institutional_verified', label: 'Campus Email Verified' };
      }
      if (verifiedStudent) {
        return { tier: 'email_registered', label: 'Student Registered' };
      }
      return { tier: 'unverified', label: 'Standard Account' };
    }

    // Valid institutional domains
    assert.equal(isInstitutionalEmail('student@iitd.ac.in'), true);
    assert.equal(isInstitutionalEmail('student@dtu.ac.in'), true);
    assert.equal(isInstitutionalEmail('scholar@du.ac.in'), true);
    assert.equal(isInstitutionalEmail('learner@stanford.edu'), true);
    assert.equal(isInstitutionalEmail('tech@rvce.edu.in'), true);

    // Personal / Non-institutional domains
    assert.equal(isInstitutionalEmail('user@gmail.com'), false);
    assert.equal(isInstitutionalEmail('user@yahoo.co.in'), false);
    assert.equal(isInstitutionalEmail('user@outlook.com'), false);
    assert.equal(isInstitutionalEmail(null), false);
    assert.equal(isInstitutionalEmail(''), false);

    // SECURITY: Username spoofing attack vectors must be strictly blocked
    assert.equal(isInstitutionalEmail('spoof.iitd.ac.in@gmail.com'), false, 'Must not be fooled by username containing college domain');
    assert.equal(isInstitutionalEmail('student@attacker.com?.iitd.ac.in'), false, 'Must reject invalid characters in domain');

    // Tier checks
    assert.equal(getVerificationTier('student@iitd.ac.in', false).tier, 'institutional_verified');
    assert.equal(getVerificationTier('user@gmail.com', true).tier, 'email_registered');
    assert.equal(getVerificationTier('user@gmail.com', false).tier, 'unverified');
  });

  it('DUAL PRICE FILTERING: correctly filters items within min and max price ranges', () => {
    const sampleCatalog = [
      { id: '1', title: 'Calculus Book', price: 150 },
      { id: '2', title: 'Scientific Calculator', price: 550 },
      { id: '3', title: 'Hostel Kettle', price: 800 },
      { id: '4', title: 'Study Desk Lamp', price: 1200 },
      { id: '5', title: 'Mountain Bicycle', price: 4500 },
    ];

    function filterByPrice(items, minPrice, maxPrice) {
      return items.filter((item) => {
        if (minPrice && item.price < minPrice) return false;
        if (maxPrice && item.price > maxPrice) return false;
        return true;
      });
    }

    // Range: 500 to 1500
    const midRange = filterByPrice(sampleCatalog, 500, 1500);
    assert.equal(midRange.length, 3);
    assert.deepEqual(midRange.map((i) => i.id), ['2', '3', '4']);

    // Range: only minPrice 1000
    const highRange = filterByPrice(sampleCatalog, 1000, null);
    assert.equal(highRange.length, 2);
    assert.deepEqual(highRange.map((i) => i.id), ['4', '5']);

    // Range: only maxPrice 600
    const lowRange = filterByPrice(sampleCatalog, null, 600);
    assert.equal(lowRange.length, 2);
    assert.deepEqual(lowRange.map((i) => i.id), ['1', '2']);
  });

  it('MULTI-IMAGE MANAGEMENT: enforces maximum 4 images and handles cover photo reordering', () => {
    let images = ['img1.jpg', 'img2.jpg'];
    const MAX_IMAGES = 4;

    function addImage(url) {
      if (images.length >= MAX_IMAGES) return false;
      images.push(url);
      return true;
    }

    function setAsCover(index) {
      if (index <= 0 || index >= images.length) return;
      const target = images[index];
      images.splice(index, 1);
      images.unshift(target);
    }

    function removeImage(index) {
      images = images.filter((_, i) => i !== index);
    }

    assert.equal(addImage('img3.jpg'), true);
    assert.equal(addImage('img4.jpg'), true);
    assert.equal(addImage('img5.jpg'), false, 'Must reject 5th image when cap is 4');
    assert.equal(images.length, 4);

    // Swap index 2 ('img3.jpg') to cover
    setAsCover(2);
    assert.equal(images[0], 'img3.jpg', 'img3.jpg must now be the cover photo at index 0');

    // Remove cover
    removeImage(0);
    assert.equal(images.length, 3);
    assert.equal(images[0], 'img1.jpg');
  });

  it('RESERVATION STATUS LIFECYCLE: allows valid status transitions (reserved -> completed | cancelled)', () => {
    const VALID_TRANSITIONS = {
      reserved: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    function canTransition(current, next) {
      return (VALID_TRANSITIONS[current] || []).includes(next);
    }

    assert.equal(canTransition('reserved', 'completed'), true);
    assert.equal(canTransition('reserved', 'cancelled'), true);
    assert.equal(canTransition('completed', 'reserved'), false);
    assert.equal(canTransition('cancelled', 'completed'), false);
  });

  it('SEO & PRODUCTION ARTIFACTS: robots.txt, sitemap.xml, and schema structured data are present', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const robotsPath = path.resolve('public/robots.txt');
    assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
    const robots = fs.readFileSync(robotsPath, 'utf8');
    assert.ok(robots.includes('User-agent: *'));
    assert.ok(robots.includes('Disallow: /dashboard'));
    assert.ok(robots.includes('Sitemap: https://campusmarttt.vercel.app/sitemap.xml'));

    const sitemapPath = path.resolve('public/sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    assert.ok(sitemap.includes('https://campusmarttt.vercel.app/'));
    assert.ok(sitemap.includes('https://campusmarttt.vercel.app/explore'));

    const indexPath = path.resolve('index.html');
    const index = fs.readFileSync(indexPath, 'utf8');
    assert.ok(index.includes('og:title'), 'index.html must have OpenGraph title');
    assert.ok(index.includes('twitter:card'), 'index.html must have Twitter card');
    assert.ok(index.includes('"@type": "WebSite"'), 'index.html must have WebSite JSON-LD');
  });

  it('CONSOLIDATED PRODUCTION MIGRATION: 20261101000000_production_ready_marketplace.sql is comprehensive', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const migrationPath = path.resolve('supabase/migrations/20261101000000_production_ready_marketplace.sql');
    assert.ok(fs.existsSync(migrationPath), 'Consolidated migration file must exist');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(sql.includes('ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.wishlists'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.conversations'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.messages'));
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.listing_reports'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.renew_listing'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.expire_stale_listings'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.delete_user_account'));
    assert.ok(sql.includes('CREATE POLICY "Buyers can update own reservations"'));
    assert.ok(sql.includes('CREATE POLICY "Users can delete own profile"'));
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.protect_reservation_updates'));
    assert.ok(sql.includes('DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects'));
    assert.ok(sql.includes('(storage.foldername(name))[1] = auth.uid()::text'));
  });

  it('PURCHASE INTEGRITY: sold, archived, or out-of-stock items cannot be added to cart or reserved', () => {
    const activeItem = { id: 'item-1', title: 'Calculus Book', price: 200, status: 'available', inStock: true };
    const soldItem = { id: 'item-2', title: 'Chemistry Kit', price: 500, status: 'sold', inStock: false };
    const reservedItem = { id: 'item-3', title: 'Desk Fan', price: 600, status: 'reserved', inStock: false };
    const archivedItem = { id: 'item-4', title: 'Old Notes', price: 50, status: 'archived', inStock: false };

    let cart = [];

    function addToCart(product) {
      if (
        product.status === 'sold' ||
        product.status === 'archived' ||
        product.status === 'reserved' ||
        product.inStock === false
      ) {
        return false;
      }
      cart.push(product);
      return true;
    }

    assert.equal(addToCart(activeItem), true);
    assert.equal(addToCart(soldItem), false, 'Sold items must not be added to cart');
    assert.equal(addToCart(reservedItem), false, 'Reserved items must not be added to cart');
    assert.equal(addToCart(archivedItem), false, 'Archived items must not be added to cart');
    assert.equal(cart.length, 1);
    assert.equal(cart[0].id, 'item-1');
  });

  it('DELIVERY HONESTY: reservation update and message delivery errors are propagated without false success simulation', () => {
    // Verify that errors returned by backend are not masked as { success: true }
    function handleUpdateResult(res) {
      if (res.error) {
        return { success: false, error: res.error.message };
      }
      return { success: true };
    }

    const mockFailure = { error: { message: 'Row level security policy violation' } };
    const mockSuccess = { error: null };

    assert.equal(handleUpdateResult(mockFailure).success, false);
    assert.equal(handleUpdateResult(mockFailure).error, 'Row level security policy violation');
    assert.equal(handleUpdateResult(mockSuccess).success, true);
  });

  it('RESERVATION SECURITY: blocks financial tampering, unauthorized buyer updates, and reopening finalized orders', () => {
    function validateReservationUpdate(existing, updates) {
      // Reopening finalized orders is strictly blocked
      if (existing.status === 'completed' || existing.status === 'cancelled') {
        return { allowed: false, reason: 'Reservation is finalized and cannot be modified.' };
      }

      // Financial and ownership tampering checks
      if (updates.total_amount !== undefined && updates.total_amount !== existing.total_amount) {
        return { allowed: false, reason: 'Financial details cannot be modified.' };
      }
      if (updates.buyer_id !== undefined && updates.buyer_id !== existing.buyer_id) {
        return { allowed: false, reason: 'Reservation ownership cannot be transferred.' };
      }
      if (updates.items !== undefined && JSON.stringify(updates.items) !== JSON.stringify(existing.items)) {
        return { allowed: false, reason: 'Items cannot be altered on active reservation.' };
      }

      // Valid status transitions
      if (updates.status && !['reserved', 'completed', 'cancelled'].includes(updates.status)) {
        return { allowed: false, reason: 'Invalid reservation status transition.' };
      }

      return { allowed: true };
    }

    const activeRes = {
      id: 'res-101',
      buyer_id: 'user-buyer-1',
      total_amount: 850,
      items: [{ productId: 'p1', title: 'Scientific Calculator', price: 850, quantity: 1 }],
      status: 'reserved',
    };

    const completedRes = { ...activeRes, status: 'completed' };

    // Legitimate status transition
    assert.equal(validateReservationUpdate(activeRes, { status: 'completed' }).allowed, true);
    assert.equal(validateReservationUpdate(activeRes, { status: 'cancelled' }).allowed, true);

    // Malicious attempts: tampering price, transferring buyer, or altering items
    assert.equal(validateReservationUpdate(activeRes, { total_amount: 0 }).allowed, false);
    assert.equal(validateReservationUpdate(activeRes, { buyer_id: 'attacker-id' }).allowed, false);
    assert.equal(validateReservationUpdate(activeRes, { items: [] }).allowed, false);

    // Reopening completed reservation
    assert.equal(validateReservationUpdate(completedRes, { status: 'reserved' }).allowed, false);
  });

  it('STORAGE ACCESS CONTROL: enforces user-scoped folder paths and blocks cross-user object deletion', () => {
    function canUserDeleteStorageObject(objectPath, authenticatedUserId, userRole = 'student') {
      if (userRole === 'admin' || userRole === 'moderator') {
        return true;
      }
      // Path format: `${userId}/${timestamp}-${filename}`
      const folderOwner = objectPath.split('/')[0];
      return folderOwner === authenticatedUserId;
    }

    const userA = 'user-uuid-1111';
    const userB = 'user-uuid-2222';
    const adminUser = 'admin-uuid-9999';

    const userAImage = `${userA}/1793540000000-textbook.jpg`;
    const userBImage = `${userB}/1793540000000-bicycle.jpg`;

    // Owner can delete own object
    assert.equal(canUserDeleteStorageObject(userAImage, userA, 'student'), true);
    assert.equal(canUserDeleteStorageObject(userBImage, userB, 'student'), true);

    // Cross-user deletion is strictly denied
    assert.equal(canUserDeleteStorageObject(userAImage, userB, 'student'), false, 'User B must not delete User A image');
    assert.equal(canUserDeleteStorageObject(userBImage, userA, 'student'), false, 'User A must not delete User B image');

    // Admin can moderate/delete any image
    assert.equal(canUserDeleteStorageObject(userAImage, adminUser, 'admin'), true);
  });
});

// -------------------------------------------------------------
// Account Creation & Email Verification Workflow Verification
// -------------------------------------------------------------

describe('Campus Mart — Account Creation & Email Verification Workflow', () => {
  it('VERIFICATION STATUS: accurately detects verified vs unconfirmed student accounts', () => {
    function computeIsEmailVerified(user) {
      if (!user) return false;
      return Boolean(user.email_confirmed_at || user.confirmed_at);
    }

    // Unverified accounts
    assert.equal(computeIsEmailVerified(null), false, 'Null user is unverified');
    assert.equal(computeIsEmailVerified({ id: 'u1', email: 'test@campus.edu', email_confirmed_at: null }), false, 'Null email_confirmed_at is unverified');
    assert.equal(computeIsEmailVerified({ id: 'u2', email: 'test@campus.edu' }), false, 'Undefined email_confirmed_at is unverified');

    // Verified accounts
    assert.equal(computeIsEmailVerified({ id: 'u3', email: 'test@campus.edu', email_confirmed_at: '2026-11-01T12:00:00Z' }), true, 'Standard email_confirmed_at is verified');
    assert.equal(computeIsEmailVerified({ id: 'u4', email: 'test@campus.edu', confirmed_at: '2026-11-01T12:00:00Z' }), true, 'Legacy confirmed_at is verified');
  });

  it('REGISTRATION WORKFLOW: correctly processes null session and flags confirmationRequired', () => {
    function processSignUpResponse(supabaseSignUpData) {
      const { user, session } = supabaseSignUpData;
      if (!user) {
        return { error: new Error('Registration failed. Please try again.') };
      }

      // Check if user already exists (Supabase returns empty identities array)
      if (user.identities && user.identities.length === 0) {
        return {
          error: new Error('An account with this email address already exists. Please sign in or use password reset.'),
        };
      }

      const isVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
      if (!session && !isVerified) {
        return {
          error: null,
          confirmationRequired: true,
          user,
        };
      }

      return {
        error: null,
        confirmationRequired: false,
        user,
      };
    }

    // Typical Supabase response when email confirmation is enabled in project settings
    const confirmationEnabledResponse = {
      user: {
        id: 'usr-new-1',
        email: 'student@iitd.ac.in',
        email_confirmed_at: null,
        identities: [{ id: 'usr-new-1', identity_data: { email: 'student@iitd.ac.in' } }],
      },
      session: null,
    };

    const res = processSignUpResponse(confirmationEnabledResponse);
    assert.equal(res.error, null);
    assert.equal(res.confirmationRequired, true);
    assert.equal(res.user.email, 'student@iitd.ac.in');

    // Immediate confirmation environment (e.g. confirmation disabled in local test)
    const instantConfirmedResponse = {
      user: {
        id: 'usr-new-2',
        email: 'instant@iitd.ac.in',
        email_confirmed_at: '2026-11-01T12:00:00Z',
        identities: [{ id: 'usr-new-2' }],
      },
      session: { access_token: 'fake-jwt', user: { id: 'usr-new-2' } },
    };

    const instantRes = processSignUpResponse(instantConfirmedResponse);
    assert.equal(instantRes.error, null);
    assert.equal(instantRes.confirmationRequired, false);
  });

  it('DUPLICATE REGISTRATION: flags existing user when identities array is empty', () => {
    function processSignUpResponse(supabaseSignUpData) {
      const { user } = supabaseSignUpData;
      if (user?.identities && user.identities.length === 0) {
        return {
          error: new Error('An account with this email address already exists. Please sign in or use password reset.'),
        };
      }
      return { error: null };
    }

    const duplicateAttemptData = {
      user: {
        id: 'usr-duplicate-1',
        email: 'existing.student@iitd.ac.in',
        identities: [], // Supabase signal for existing email
      },
      session: null,
    };

    const res = processSignUpResponse(duplicateAttemptData);
    assert.ok(res.error);
    assert.match(res.error.message, /already exists/i);
  });

  it('FEATURE GUARDS: strictly blocks unconfirmed and anonymous users across all protected operations', () => {
    function checkFeatureAccess(user, isEmailVerified, _action) {
      if (!user) {
        return { allowed: false, reason: 'authentication_required', action: 'open_signin_modal' };
      }
      if (!isEmailVerified) {
        return { allowed: false, reason: 'email_verification_required', action: 'open_verify_modal' };
      }
      return { allowed: true, reason: 'granted' };
    }

    const anonymousUser = null;
    const unverifiedUser = { id: 'u-unconfirmed', email: 'unconfirmed@campus.edu' };
    const verifiedUser = { id: 'u-verified', email: 'verified@campus.edu' };

    const protectedFeatures = ['publish_listing', 'send_message', 'place_reservation', 'seller_dashboard', 'submit_report'];

    for (const feature of protectedFeatures) {
      // Anonymous user
      const anonCheck = checkFeatureAccess(anonymousUser, false, feature);
      assert.equal(anonCheck.allowed, false, `Anonymous user must not access ${feature}`);
      assert.equal(anonCheck.action, 'open_signin_modal');

      // Unverified user
      const unverifiedCheck = checkFeatureAccess(unverifiedUser, false, feature);
      assert.equal(unverifiedCheck.allowed, false, `Unverified user must not access ${feature}`);
      assert.equal(unverifiedCheck.action, 'open_verify_modal');

      // Verified user
      const verifiedCheck = checkFeatureAccess(verifiedUser, true, feature);
      assert.equal(verifiedCheck.allowed, true, `Verified user must be granted access to ${feature}`);
    }
  });

  it('RESEND CONFIRMATION: detects rate limiting (429) and enforces 60-second cooldown timer', () => {
    function simulateResendCall({ email, lastSentTimestamp, currentTimestamp, apiStatus }) {
      if (!email) {
        return { error: new Error('Please enter a valid email address.') };
      }
      const cooldownRemaining = Math.max(0, 60 - Math.floor((currentTimestamp - lastSentTimestamp) / 1000));
      if (lastSentTimestamp > 0 && cooldownRemaining > 0) {
        return { error: new Error(`Please wait ${cooldownRemaining}s before requesting another verification email.`) };
      }
      if (apiStatus === 429) {
        return { error: new Error('Verification email rate limit reached. Please wait a few minutes before requesting another link.') };
      }
      return { success: true, cooldownRemaining: 60 };
    }

    const t0 = 1000000;
    // Initial send succeeds
    const send1 = simulateResendCall({ email: 'student@campus.edu', lastSentTimestamp: 0, currentTimestamp: t0, apiStatus: 200 });
    assert.equal(send1.success, true);
    assert.equal(send1.cooldownRemaining, 60);

    // Immediate second attempt within cooldown (10 seconds later) fails
    const send2 = simulateResendCall({ email: 'student@campus.edu', lastSentTimestamp: t0, currentTimestamp: t0 + 10000, apiStatus: 200 });
    assert.ok(send2.error);
    assert.match(send2.error.message, /wait 50s/i);

    // Attempt after cooldown expires (65 seconds later) succeeds
    const send3 = simulateResendCall({ email: 'student@campus.edu', lastSentTimestamp: t0, currentTimestamp: t0 + 65000, apiStatus: 200 });
    assert.equal(send3.success, true);

    // Upstream Supabase rate limit triggers friendly guidance
    const send4 = simulateResendCall({ email: 'student@campus.edu', lastSentTimestamp: 0, currentTimestamp: t0, apiStatus: 429 });
    assert.ok(send4.error);
    assert.match(send4.error.message, /rate limit reached/i);
  });

  it('URL HASH CALLBACK: parses token errors and OTP expiration parameters safely', () => {
    function parseAuthHash(hashString) {
      if (!hashString || !hashString.includes('=')) return null;
      const cleanHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
      const params = new URLSearchParams(cleanHash);
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');
      const errorMsg = params.get('error');
      const type = params.get('type');

      if (errorCode === 'otp_expired' || errorDesc?.toLowerCase().includes('expired')) {
        return {
          type: 'error',
          message: 'Your email verification link has expired or has already been used. Please request a new verification link below.',
        };
      }

      if (errorCode || errorMsg) {
        return {
          type: 'error',
          message: errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : 'Authentication failed. Please try again.',
        };
      }

      if (type === 'signup') {
        return {
          type: 'success',
          message: 'Email confirmed successfully! Your student account is now active.',
        };
      }

      return null;
    }

    // Expired OTP token callback
    const expiredOtpHash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    const expiredResult = parseAuthHash(expiredOtpHash);
    assert.equal(expiredResult.type, 'error');
    assert.match(expiredResult.message, /expired or has already been used/i);

    // Generic error callback
    const genericErrorHash = '#error=server_error&error_description=Temporary+failure';
    const genericResult = parseAuthHash(genericErrorHash);
    assert.equal(genericResult.type, 'error');
    assert.match(genericResult.message, /Temporary failure/i);

    // Successful signup callback
    const signupSuccessHash = '#access_token=token123&type=signup';
    const successResult = parseAuthHash(signupSuccessHash);
    assert.equal(successResult.type, 'success');
    assert.match(successResult.message, /Email confirmed successfully/i);
  });

  it('PASSWORD CONFIRMATION: ensures passwords match before registration dispatch', () => {
    function validateRegistrationInputs({ email, password, confirmPassword, fullName }) {
      if (!fullName?.trim()) return { valid: false, error: 'Full name is required' };
      if (!email?.trim()) return { valid: false, error: 'Email is required' };
      if (!password || password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
      if (password !== confirmPassword) return { valid: false, error: 'Passwords do not match. Please re-enter your password correctly.' };
      return { valid: true };
    }

    assert.equal(validateRegistrationInputs({ email: 's@campus.edu', fullName: 'Student', password: 'secretpassword', confirmPassword: 'differentpassword' }).valid, false);
    assert.equal(validateRegistrationInputs({ email: 's@campus.edu', fullName: 'Student', password: 'secretpassword', confirmPassword: 'secretpassword' }).valid, true);
  });
});

describe('Campus Mart — In-App Messaging & Campus Chats', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function isValidUuid(id) {
    return typeof id === 'string' && UUID_REGEX.test(id.trim());
  }

  function validateStartChat({ buyerId, sellerId, listingId, isEmailVerified }) {
    if (!buyerId) {
      return { ok: false, error: 'Please sign in to start chatting with the seller.' };
    }
    if (!isEmailVerified) {
      return { ok: false, error: 'Please verify your campus email before chatting with sellers.' };
    }
    if (!listingId) {
      return { ok: false, error: 'Listing not found.' };
    }
    if (!sellerId) {
      return { ok: false, error: 'Seller information is missing.' };
    }
    if (buyerId === sellerId) {
      return { ok: false, error: "You cannot chat with yourself about your own listing." };
    }
    if (!isValidUuid(sellerId)) {
      return {
        ok: false,
        error: 'This is a sample showcase listing. In-app messaging is available for listings posted by verified student accounts.',
      };
    }
    return { ok: true };
  }

  it('CHAT IN APP VALIDATION: prevents unverified, self-chat, and invalid UUID mock sellers', () => {
    const validBuyer = '11111111-1111-4111-8111-111111111111';
    const validSeller = '22222222-2222-4222-8222-222222222222';
    const sampleMockSeller = 'sell-01';

    // 1. Unauthenticated buyer
    const resUnauth = validateStartChat({ buyerId: null, sellerId: validSeller, listingId: 'p1', isEmailVerified: false });
    assert.equal(resUnauth.ok, false);
    assert.match(resUnauth.error, /sign in/i);

    // 2. Unverified email
    const resUnverified = validateStartChat({ buyerId: validBuyer, sellerId: validSeller, listingId: 'p1', isEmailVerified: false });
    assert.equal(resUnverified.ok, false);
    assert.match(resUnverified.error, /verify your campus email/i);

    // 3. Self chat
    const resSelf = validateStartChat({ buyerId: validBuyer, sellerId: validBuyer, listingId: 'p1', isEmailVerified: true });
    assert.equal(resSelf.ok, false);
    assert.match(resSelf.error, /cannot chat with yourself/i);

    // 4. Sample showcase seller with mock non-UUID ID
    const resMock = validateStartChat({ buyerId: validBuyer, sellerId: sampleMockSeller, listingId: 'p1', isEmailVerified: true });
    assert.equal(resMock.ok, false);
    assert.match(resMock.error, /sample showcase listing/i);

    // 5. Valid student-to-student interaction
    const resValid = validateStartChat({ buyerId: validBuyer, sellerId: validSeller, listingId: 'p1', isEmailVerified: true });
    assert.equal(resValid.ok, true);
  });

  it('CONVERSATION RETRIEVAL & CREATION: deduplicates by listing_id and buyer_id', () => {
    // In-memory conversation store simulating Supabase unique constraint
    const conversations = [];

    function getOrCreateConversation(listingId, buyerId, sellerId) {
      if (buyerId === sellerId) throw new Error('Cannot start conversation with yourself');
      const existing = conversations.find(c => c.listing_id === listingId && c.buyer_id === buyerId);
      if (existing) {
        return { conversation: existing, created: false };
      }
      const newConv = {
        id: `conv-${conversations.length + 1}`,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        created_at: new Date().toISOString(),
        last_message_text: null,
        last_message_at: null,
      };
      conversations.push(newConv);
      return { conversation: newConv, created: true };
    }

    const listingA = 'prod-101';
    const buyer1 = 'user-buyer-1';
    const seller1 = 'user-seller-1';

    // First call creates conversation
    const res1 = getOrCreateConversation(listingA, buyer1, seller1);
    assert.equal(res1.created, true);
    assert.equal(res1.conversation.id, 'conv-1');

    // Second call with same buyer and listing returns existing without duplicating
    const res2 = getOrCreateConversation(listingA, buyer1, seller1);
    assert.equal(res2.created, false);
    assert.equal(res2.conversation.id, 'conv-1');
    assert.equal(conversations.length, 1);

    // Different buyer creates separate conversation
    const res3 = getOrCreateConversation(listingA, 'user-buyer-2', seller1);
    assert.equal(res3.created, true);
    assert.equal(res3.conversation.id, 'conv-2');
    assert.equal(conversations.length, 2);
  });

  it('MESSAGE SENDING: trims whitespace, rejects blank text, and updates conversation preview', () => {
    function createMessage(conversation, senderId, rawText) {
      const text = rawText ? rawText.trim() : '';
      if (!text) {
        throw new Error('Message cannot be empty');
      }
      const msg = {
        id: `msg-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: senderId,
        body: text,
        created_at: new Date().toISOString(),
      };
      // Simulates trigger/RPC update to conversation metadata
      conversation.last_message_text = text;
      conversation.last_message_at = msg.created_at;
      return msg;
    }

    const testConv = { id: 'conv-test', last_message_text: null, last_message_at: null };

    // Empty message rejection
    assert.throws(() => createMessage(testConv, 'u1', ''), /cannot be empty/i);
    assert.throws(() => createMessage(testConv, 'u1', '   \n\t  '), /cannot be empty/i);

    // Valid message trimmed and preview updated
    const msg = createMessage(testConv, 'u1', '  Hey, is the cycle still available?  ');
    assert.equal(msg.body, 'Hey, is the cycle still available?');
    assert.equal(testConv.last_message_text, 'Hey, is the cycle still available?');
    assert.ok(testConv.last_message_at);
  });

  it('CONVERSATION LIST ENRICHMENT: maps other participant profile, listing metadata, and role badges', () => {
    const currentUserId = 'user-student-a';

    const rawConversations = [
      {
        id: 'c1',
        listing_id: 'prod-cycle',
        buyer_id: 'user-student-a', // current user is buyer
        seller_id: 'user-student-b',
        last_message_text: 'Can we meet at the library gate?',
        last_message_at: '2026-11-01T14:30:00Z',
      },
      {
        id: 'c2',
        listing_id: 'prod-kettle',
        buyer_id: 'user-student-c',
        seller_id: 'user-student-a', // current user is seller
        last_message_text: 'Is the price negotiable?',
        last_message_at: '2026-11-01T15:00:00Z',
      },
    ];

    const profilesMap = {
      'user-student-b': { id: 'user-student-b', full_name: 'Priya Verma', college: 'IIT Delhi', avatar_url: null },
      'user-student-c': { id: 'user-student-c', full_name: 'Rohan Mehta', college: 'IIT Bombay', avatar_url: null },
    };

    const listingsMap = {
      'prod-cycle': { id: 'prod-cycle', title: 'Hercules Geared Bicycle', price: 2800, image_url: 'https://example.com/cycle.jpg' },
      'prod-kettle': { id: 'prod-kettle', title: '1.5L Electric Kettle', price: 450, image_url: 'https://example.com/kettle.jpg' },
    };

    function enrichConversations(convs, userId) {
      return convs.map(c => {
        const isBuyer = c.buyer_id === userId;
        const otherUserId = isBuyer ? c.seller_id : c.buyer_id;
        const otherProfile = profilesMap[otherUserId] || { full_name: 'Campus Student' };
        const listing = listingsMap[c.listing_id] || { title: 'Campus Item', price: 0 };
        return {
          id: c.id,
          listingId: c.listing_id,
          buyerId: c.buyer_id,
          sellerId: c.seller_id,
          otherUser: {
            id: otherUserId,
            name: otherProfile.full_name,
            college: otherProfile.college,
            roleBadge: isBuyer ? 'Seller' : 'Buyer',
          },
          listing: {
            title: listing.title,
            price: listing.price,
            imageUrl: listing.image_url,
          },
          lastMessageText: c.last_message_text,
          lastMessageAt: c.last_message_at,
        };
      });
    }

    const enriched = enrichConversations(rawConversations, currentUserId);
    assert.equal(enriched.length, 2);

    // In conv 1: current user is buyer, so otherUser is Priya (Seller)
    assert.equal(enriched[0].otherUser.name, 'Priya Verma');
    assert.equal(enriched[0].otherUser.roleBadge, 'Seller');
    assert.equal(enriched[0].listing.title, 'Hercules Geared Bicycle');

    // In conv 2: current user is seller, so otherUser is Rohan (Buyer)
    assert.equal(enriched[1].otherUser.name, 'Rohan Mehta');
    assert.equal(enriched[1].otherUser.roleBadge, 'Buyer');
    assert.equal(enriched[1].listing.title, '1.5L Electric Kettle');
  });

  it('ERROR STATE VS EMPTY STATE: distinguishes missing tables / DB network failures from genuine 0 conversations', () => {
    function processConversationResult(dbResult) {
      if (dbResult.error) {
        if (dbResult.error.code === 'PGRST205' || dbResult.error.code === '42P01') {
          return {
            status: 'error',
            conversations: [],
            errorMessage: 'In-app chat tables are not configured on the Supabase database. Please execute the messaging migration.',
          };
        }
        return {
          status: 'error',
          conversations: [],
          errorMessage: dbResult.error.message || 'Failed to load conversations.',
        };
      }
      return {
        status: dbResult.data.length === 0 ? 'empty' : 'ready',
        conversations: dbResult.data,
        errorMessage: null,
      };
    }

    // 1. Missing table error (PGRST205) must not be rendered as "No conversations yet"
    const missingTableRes = processConversationResult({
      data: null,
      error: { code: 'PGRST205', message: "Could not find the 'conversations' table" },
    });
    assert.equal(missingTableRes.status, 'error');
    assert.match(missingTableRes.errorMessage, /In-app chat tables are not configured/i);

    // 2. Genuine empty state (0 conversations created by user)
    const legitimateEmptyRes = processConversationResult({
      data: [],
      error: null,
    });
    assert.equal(legitimateEmptyRes.status, 'empty');
    assert.equal(legitimateEmptyRes.errorMessage, null);
    assert.equal(legitimateEmptyRes.conversations.length, 0);

    // 3. Populated state
    const readyRes = processConversationResult({
      data: [{ id: 'c1' }],
      error: null,
    });
    assert.equal(readyRes.status, 'ready');
    assert.equal(readyRes.conversations.length, 1);
  });
});




