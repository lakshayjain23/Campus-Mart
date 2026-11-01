import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';

const client = createClient(supabaseUrl, supabaseAnonKey);

const tablesToProbe = [
  'campuses',
  'products',
  'profiles',
  'reservations',
  'product_enquiries',
  'contact_inquiries',
  'wishlists',
  'conversations',
  'messages',
  'listing_reports'
];

async function probe() {
  console.log('=== REMOTE SUPABASE TABLE PROBE ===');
  for (const table of tablesToProbe) {
    const { data, error } = await client.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR (${error.code}) - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS (returned ${data.length} rows)`);
    }
  }

  console.log('\n=== PRODUCTS TABLE COLUMNS PROBE ===');
  const cols = ['id', 'title', 'price', 'status', 'expires_at', 'course_code', 'semester', 'category_fields', 'in_stock'];
  for (const col of cols) {
    const { error } = await client.from('products').select(col).limit(1);
    if (error) {
      console.log(`Column 'products.${col}': FAILED (${error.code}) - ${error.message}`);
    } else {
      console.log(`Column 'products.${col}': EXISTS`);
    }
  }

  console.log('\n=== PROFILES TABLE COLUMNS PROBE ===');
  const profCols = ['id', 'full_name', 'college', 'role'];
  for (const col of profCols) {
    const { error } = await client.from('profiles').select(col).limit(1);
    if (error) {
      console.log(`Column 'profiles.${col}': FAILED (${error.code}) - ${error.message}`);
    } else {
      console.log(`Column 'profiles.${col}': EXISTS`);
    }
  }

  console.log('\n=== RPC FUNCTIONS PROBE ===');
  const { error: renewErr } = await client.rpc('renew_listing', { p_listing_id: 'test' });
  console.log('RPC renew_listing:', renewErr ? `${renewErr.code}: ${renewErr.message}` : 'EXISTS');

  const { error: expireErr } = await client.rpc('expire_stale_listings');
  console.log('RPC expire_stale_listings:', expireErr ? `${expireErr.code}: ${expireErr.message}` : 'EXISTS');

  const { error: deleteAccErr } = await client.rpc('delete_user_account');
  console.log('RPC delete_user_account:', deleteAccErr ? `${deleteAccErr.code}: ${deleteAccErr.message}` : 'EXISTS');
}

probe().catch(console.error);
