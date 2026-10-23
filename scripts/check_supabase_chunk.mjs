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

async function checkSupabaseChunk() {
  const res = await fetchUrl('https://campus-mart-sandy.vercel.app/assets/supabase-1yby8ldT.js');
  console.log('supabase chunk HTTP:', res.status, 'size:', res.data.length);
  const checkStrings = ['conversations', 'listing_reports', 'renew_listing', 'expire_stale_listings'];
  for (const str of checkStrings) {
    console.log(`String "${str}" in supabase chunk: ${res.data.includes(str) ? 'FOUND' : 'NOT FOUND'}`);
  }
}

checkSupabaseChunk().catch(console.error);
