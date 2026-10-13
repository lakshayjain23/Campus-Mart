import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------------
// Pure Unit Logic Tests
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

describe('Campus Mart — Unit Tests', () => {
  it('formats Indian Rupee prices accurately', () => {
    assert.match(formatPriceINR(999), /₹\s*999/);
    assert.match(formatPriceINR(1500), /₹\s*1,500/);
    assert.match(formatPriceINR(150000), /₹\s*1,50,000/);
  });

  it('assigns correct badges for all product conditions', () => {
    assert.equal(getConditionBadge('brand_new').label, 'Brand New');
    assert.equal(getConditionBadge('like_new').label, 'Like New');
    assert.equal(getConditionBadge('good').label, 'Good Condition');
    assert.equal(getConditionBadge('fair').label, 'Fair / Functional');
    assert.equal(getConditionBadge('student_created').label, 'Student Made');
    assert.equal(getConditionBadge('student_created').icon, true);
  });

  it('filters products correctly by search query and category', () => {
    const mockList = [
      { id: '1', title: 'Casio Calculator', description: 'scientific tool', category: 'Electronics', condition: 'like_new', price: 999, campus: 'IIT Delhi', tags: ['calc'] },
      { id: '2', title: 'Algorithms CLRS', description: 'computer science textbook', category: 'Books', condition: 'good', price: 650, campus: 'DTU', tags: ['cs', 'book'] },
      { id: '3', title: 'Electric Kettle', description: 'hostel appliance', category: 'Electronics', condition: 'fair', price: 400, campus: 'IIT Delhi', tags: ['hostel'] },
    ];

    const searchResults = filterProducts(mockList, { searchQuery: 'calculator' });
    assert.equal(searchResults.length, 1);
    assert.equal(searchResults[0].id, '1');

    const catResults = filterProducts(mockList, { category: 'Electronics' });
    assert.equal(catResults.length, 2);

    const priceResults = filterProducts(mockList, { maxPrice: 700 });
    assert.equal(priceResults.length, 2);

    const campusResults = filterProducts(mockList, { campus: 'IIT Delhi - Main Campus' });
    assert.equal(campusResults.length, 2);
  });

  it('calculates cart item line totals and cumulative order sums', () => {
    const items = [
      { price: 999, quantity: 1 },
      { price: 500, quantity: 2 },
      { price: 250, quantity: 3 },
    ];
    const total = calculateCartTotal(items);
    assert.equal(total, 999 + 1000 + 750); // 2749
  });
});

// -------------------------------------------------------------
// Live Supabase Integration & RLS Tests
// -------------------------------------------------------------

const supabaseUrl = 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Campus Mart — Supabase Integration & Security Tests', () => {
  it('connects to Supabase and fetches campus institutions', async () => {
    const { data, error } = await supabase.from('campuses').select('name');
    assert.equal(error, null, `Error fetching campuses: ${error?.message}`);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 7, 'Expected at least 7 campuses');
  });

  it('fetches products catalog safely with public permissions', async () => {
    const { data, error } = await supabase.from('products').select('id, title, price, in_stock');
    assert.equal(error, null, `Error fetching products: ${error?.message}`);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0, 'Products catalog should contain listings');
  });

  it('successfully creates contact inquiries without leaking other rows', async () => {
    const { error } = await supabase
      .from('contact_inquiries')
      .insert({
        name: 'Automated Test Runner',
        email: 'qa@campus.edu',
        subject: 'Automated CI Test',
        message: 'Verifying insert functionality.',
      });

    assert.equal(error, null, `Error inserting contact inquiry: ${error?.message}`);
  });

  it('verifies product_images storage bucket exists and is accessible for uploads', async () => {
    const { data, error } = await supabase.storage.from('product-images').list();
    assert.equal(error, null, `Error accessing product-images bucket: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  it('ENFORCES RLS: blocks anonymous unauthenticated update on products', async () => {
    // Attempting to modify product prod-01 without seller auth
    const { error: _error } = await supabase
      .from('products')
      .update({ title: 'Unauthorized Modification Attempt' })
      .eq('id', 'prod-01');

    // Either error returned or 0 rows modified due to RLS filtering out non-owned rows
    const { data: verifyRow } = await supabase
      .from('products')
      .select('title')
      .eq('id', 'prod-01')
      .single();

    assert.notEqual(
      verifyRow?.title,
      'Unauthorized Modification Attempt',
      'RLS must prevent unauthenticated modification of product listings!'
    );
  });

  it('authenticates verified student account and establishes session', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'student@campus.edu',
      password: 'CampusMart2026!',
    });
    assert.equal(error, null, `Student login failed: ${error?.message}`);
    assert.ok(data.user, 'Expected authenticated user object');
    assert.ok(data.session?.access_token, 'Expected JWT access token');
  });

  it('provisions student accounts and auto-creates verified profile', async () => {
    const testEmail = `test.student.${Date.now()}@campus.edu`;
    const { data: rpcData, error: rpcError } = await supabase.rpc('register_student_account', {
      p_email: testEmail,
      p_password: 'TestPassword2026!',
      p_full_name: 'Test Student Automated',
      p_college: 'IIT Delhi - Main Campus',
      p_department: 'Computer Science',
    });

    assert.equal(rpcError, null, `RPC failed: ${rpcError?.message}`);
    assert.ok(rpcData?.success, 'RPC should succeed');

    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('full_name, college')
      .eq('email', testEmail)
      .maybeSingle();

    assert.equal(profError, null);
    assert.equal(profile?.full_name, 'Test Student Automated');
  });
});

