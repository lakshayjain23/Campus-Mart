import https from 'https';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function inspectProductionBuild() {
  console.log('=== VERIFYING DEPLOYED PRODUCTION BUILD ===');
  const routes = ['/', '/explore', '/sell', '/dashboard', '/orders', '/messages', '/moderation', '/wishlist', '/cart', '/nonexistent_route_test'];
  for (const r of routes) {
    const res = await fetchUrl('https://campus-mart-sandy.vercel.app' + r);
    console.log(`Route ${r}: HTTP ${res.status}`);
  }

  // Check main JS bundle
  console.log('\n--- Fetching Deployed JS Bundle ---');
  const bundleRes = await fetchUrl('https://campus-mart-sandy.vercel.app/assets/index-DXalt1oI.js');
  console.log('Bundle HTTP status:', bundleRes.status, 'Bundle size:', bundleRes.data.length, 'bytes');

  // Check what strings/features exist in the deployed bundle
  const checkStrings = [
    'supabase',
    'register_student_account',
    'conversations',
    'listing_reports',
    'renew_listing',
    'expire_stale_listings',
    'Central Library',
    'Course Textbooks',
    'Dorm & Room Essentials',
    'Campus Mobility',
    'Electronics & Accessories',
    'service_role',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  for (const str of checkStrings) {
    const found = bundleRes.data.includes(str);
    console.log(`String "${str}": ${found ? 'FOUND' : 'NOT FOUND'}`);
  }
}

inspectProductionBuild().catch(console.error);
