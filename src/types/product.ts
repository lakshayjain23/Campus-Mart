export type Condition = 
  | 'brand_new' 
  | 'like_new' 
  | 'good' 
  | 'fair' 
  | 'student_created';

export interface Seller {
  id: string;
  name: string;
  department: string;
  year: string;
  hostel: string;
  rating: number;
  reviewsCount: number;
  verifiedStudent: boolean;
  avatarUrl: string;
  responseTime: string;
  campus: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: Condition;
  images: string[];
  seller: Seller;
  campus: string;
  pickupLocation: string;
  tags: string[];
  createdAt: string;
  featured?: boolean;
  isRecent?: boolean;
  inStock?: boolean;
  specifications?: Record<string, string>;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPickupSlot?: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  condition: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  campus: string;
}
