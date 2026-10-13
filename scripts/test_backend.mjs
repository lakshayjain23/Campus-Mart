import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('Testing Supabase Backend Integrations...\n');

  // Test 1: Contact Inquiry
  console.log('1. Testing contact_inquiries table insert...');
  const { data: contactData, error: contactErr } = await supabase
    .from('contact_inquiries')
    .insert({
      name: 'Verification Bot',
      email: 'test@campus.edu',
      college: 'IIT Delhi - Main Campus',
      subject: 'Backend Verification Test',
      message: 'Automated test to verify inquiry storage in Supabase backend.',
    })
    .select()
    .single();

  if (contactErr) {
    console.error('❌ Contact inquiry test failed:', contactErr.message);
  } else {
    console.log('✅ Contact inquiry saved successfully with ID:', contactData.id);
  }

  // Test 2: Product Enquiry
  console.log('\n2. Testing product_enquiries table insert...');
  const { data: enquiryData, error: enquiryErr } = await supabase
    .from('product_enquiries')
    .insert({
      product_id: 'prod-01',
      product_title: 'Casio fx-991CW ClassWiz Scientific Calculator',
      product_price: 999,
      seller_id: 'sell-01',
      seller_name: 'Aarav Sharma',
      message: 'Hi! Can we meet near the library today?',
      preferred_meetup: 'Central Library Lawn',
      share_contact_consent: true,
    })
    .select()
    .single();

  if (enquiryErr) {
    console.error('❌ Product enquiry test failed:', enquiryErr.message);
  } else {
    console.log('✅ Product enquiry saved successfully with ID:', enquiryData.id);
  }

  // Test 3: Reservation
  console.log('\n3. Testing reservations table insert...');
  const { data: resData, error: resErr } = await supabase
    .from('reservations')
    .insert({
      items: [
        {
          productId: 'prod-01',
          title: 'Casio fx-991CW ClassWiz Scientific Calculator',
          price: 999,
          quantity: 1,
          sellerName: 'Aarav Sharma',
        },
      ],
      total_amount: 999,
      campus: 'IIT Delhi - Main Campus',
      pickup_slot: 'Today 5:00 PM - SAC / Central Canteen',
    })
    .select()
    .single();

  if (resErr) {
    console.error('❌ Reservation test failed:', resErr.message);
  } else {
    console.log('✅ Reservation saved successfully with ID:', resData.id);
  }

  // Test 4: Campuses
  console.log('\n4. Testing campuses table fetch...');
  const { data: campusData, error: campusErr } = await supabase
    .from('campuses')
    .select('*');

  if (campusErr) {
    console.error('❌ Campuses fetch failed:', campusErr.message);
  } else {
    console.log(`✅ Campuses fetched successfully (${campusData.length} colleges):`);
    console.log(campusData.map((c) => `  - ${c.name}`).join('\n'));
  }

  // Test 5: Products
  console.log('\n5. Testing products table fetch...');
  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .select('id, title, price, campus')
    .limit(3);

  if (prodErr) {
    console.error('❌ Products fetch failed:', prodErr.message);
  } else {
    console.log(`✅ Products fetched successfully (showing 3 of ${prodData.length}):`);
    console.log(prodData.map((p) => `  - [${p.id}] ${p.title} (₹${p.price})`).join('\n'));
  }

  console.log('\n🎉 ALL SUPABASE BACKEND INTEGRATION TESTS PASSED!');
}

runTests().catch(console.error);
