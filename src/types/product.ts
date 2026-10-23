export type Condition = 
  | 'brand_new' 
  | 'like_new' 
  | 'good' 
  | 'fair' 
  | 'student_created';

export type ListingStatus = 'available' | 'reserved' | 'sold' | 'archived';

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

export interface TextbookFields {
  courseCode: string;
  semester: string;
  bookTitle?: string;
  author?: string;
  edition?: string;
}

export interface DormFields {
  itemType?: string;
  dimensions?: string;
  includedAccessories?: string;
}

export interface MobilityFields {
  mobilityType?: string; // Bicycle, Skateboard, E-scooter, etc.
  gearCount?: string;
  hasLock?: boolean;
}

export interface ElectronicsFields {
  brand?: string;
  model?: string;
  compatibility?: string;
}

export type CategorySpecificFields = TextbookFields | DormFields | MobilityFields | ElectronicsFields | Record<string, any>;

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
  expiresAt?: string;
  updatedAt?: string;
  status?: ListingStatus;
  featured?: boolean;
  isRecent?: boolean;
  inStock?: boolean;
  specifications?: Record<string, string>;
  // Campus structured fields
  courseCode?: string;
  semester?: string;
  categoryFields?: CategorySpecificFields;
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
  status?: 'all' | 'available' | 'reserved' | 'sold';
  courseCode?: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  campus: string;
}
