import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://krywmdjbtzhkzkxyjwcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXdtZGpidHpoa3preHlqd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODU3OTcsImV4cCI6MjEwNzQ2MTc5N30.RO23USEbV2atZmE9qc6A20fQ6oFYPgOFrtQJ4R524f0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Seeding mock products into Supabase...');

  // Read mock products from JSON or file
  const mockFilePath = path.resolve('src/data/mockProducts.ts');
  const content = fs.readFileSync(mockFilePath, 'utf8');

  // Match the array MOCK_PRODUCTS = [ ... ]
  const match = content.match(/export const MOCK_PRODUCTS: Product\[\] = (\[[\s\S]*?\]);\s*$/);
  if (!match) {
    console.error('Could not find MOCK_PRODUCTS array in file');
    process.exit(1);
  }

  // Evaluate the products array in a safe sandbox function
  const products = (new Function(`return ${match[1]}`))();
  console.log(`Found ${products.length} mock products to seed.`);

  for (const p of products) {
    const { error } = await supabase.from('products').upsert({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      original_price: p.originalPrice ?? null,
      category: p.category,
      condition: p.condition,
      images: p.images,
      campus: p.campus,
      pickup_location: p.pickupLocation,
      seller_id: p.seller.id,
      seller_name: p.seller.name,
      seller_department: p.seller.department,
      seller_year: p.seller.year,
      seller_hostel: p.seller.hostel,
      seller_rating: p.seller.rating,
      seller_reviews_count: p.seller.reviewsCount,
      seller_verified: p.seller.verifiedStudent,
      seller_avatar_url: p.seller.avatarUrl,
      seller_response_time: p.seller.responseTime,
      tags: p.tags,
      featured: p.featured ?? false,
      is_recent: p.isRecent ?? false,
      in_stock: p.inStock ?? true,
    }, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting ${p.id}:`, error.message);
    } else {
      console.log(`Seeded: ${p.id} - ${p.title.slice(0, 30)}...`);
    }
  }

  console.log('Finished seeding products!');
}

main().catch(console.error);
