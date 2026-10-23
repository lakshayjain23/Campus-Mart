import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProductionDatabase() {
  console.log('=== CAMPUS MART PRODUCTION DATABASE AUDIT ===');
  console.log('Supabase URL:', supabaseUrl);

  const results = {};

  // 1. Check Tables
  const tables = ['campuses', 'products', 'profiles', 'conversations', 'messages', 'listing_reports', 'reservations', 'product_enquiries', 'contact_inquiries'];
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      results[table] = {
        accessible: !error || status === 200 || status === 406,
        status,
        error: error ? error.message : null,
        sampleCount: data ? data.length : 0,
      };
    } catch (e) {
      results[table] = { accessible: false, error: e.message };
    }
  }

  console.log('\n--- Table Accessibility & Existence ---');
  for (const [table, info] of Object.entries(results)) {
    console.log(`${table}: ${info.error ? '❌ ' + info.error : '✅ OK (status: ' + info.status + ')'}`);
  }

  // 2. Check Products Schema Columns
  console.log('\n--- Checking products table columns ---');
  const { data: prodSample, error: prodErr } = await supabase.from('products').select('*').limit(1);
  if (prodSample && prodSample.length > 0) {
    const cols = Object.keys(prodSample[0]);
    console.log('Detected products columns:', cols.join(', '));
    const requiredCols = ['status', 'expires_at', 'course_code', 'semester', 'category_fields'];
    for (const req of requiredCols) {
      console.log(`Column "${req}": ${cols.includes(req) ? '✅ PRESENT' : '❌ MISSING'}`);
    }
  } else {
    console.log('Could not retrieve sample product or table empty:', prodErr?.message);
  }

  // 3. Check RPC Functions
  console.log('\n--- Checking RPC functions ---');
  // Check register_student_account
  try {
    const { data: regData, error: regErr } = await supabase.rpc('register_student_account', {
      p_email: 'test_probe_' + Date.now() + '@example.com',
      p_password: '12', // purposely short to test function existence and validation
      p_full_name: 'Probe',
      p_college: 'IIT Delhi',
    });
    console.log('RPC register_student_account:', regErr ? 'Error: ' + regErr.message : 'Result: ' + JSON.stringify(regData));
  } catch (e) {
    console.log('RPC register_student_account exception:', e.message);
  }

  // Check renew_listing
  try {
    const { data: renewData, error: renewErr } = await supabase.rpc('renew_listing', {
      p_listing_id: 'nonexistent-probe-id',
    });
    console.log('RPC renew_listing:', renewErr ? 'Error: ' + renewErr.message : 'Result: ' + JSON.stringify(renewData));
  } catch (e) {
    console.log('RPC renew_listing exception:', e.message);
  }

  // Check expire_stale_listings
  try {
    const { data: expData, error: expErr } = await supabase.rpc('expire_stale_listings');
    console.log('RPC expire_stale_listings:', expErr ? 'Error: ' + expErr.message : 'Result: ' + JSON.stringify(expData));
  } catch (e) {
    console.log('RPC expire_stale_listings exception:', e.message);
  }

  // 4. Check Storage Buckets
  console.log('\n--- Checking Storage Buckets ---');
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.log('storage.listBuckets error:', bErr.message);
    } else {
      console.log('Buckets:', buckets.map(b => b.name).join(', '));
    }
  } catch (e) {
    console.log('Storage exception:', e.message);
  }

  try {
    const { data: files, error: fErr } = await supabase.storage.from('product-images').list();
    console.log('product-images bucket files access:', fErr ? '❌ ' + fErr.message : `✅ OK (${files.length} items visible)`);
  } catch (e) {
    console.log('product-images access exception:', e.message);
  }
}

inspectProductionDatabase().catch(console.error);
