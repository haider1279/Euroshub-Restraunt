export type Role = 'ADMIN' | 'CUSTOMER';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  _count?: {
    items: number;
  };
}

export interface ProductVariant {
  id: string;
  productId?: string;
  name: string;
  price: number | string;
  sortOrder?: number;
  isAvailable?: boolean;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number | string;
  isAvailable?: boolean;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity?: number | null;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number | string;
  imageUrl?: string | null;
  ingredients: string[];
  tags: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isChefSpecial?: boolean;
  sortOrder?: number;
  categoryId: string;
  category?: MenuCategory;
  variants?: ProductVariant[];
  addonLinks?: Array<{ id: string; addon: ProductAddon }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId?: string | null;
  variantId?: string | null;
  nameAtPurchase: string;
  variantNameAtPurchase?: string | null;
  priceAtPurchase: number | string;
  addonsSnapshot?: any;
  quantity: number;
  menuItem?: {
    id?: string;
    name?: string;
    imageUrl?: string | null;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  type: OrderType;
  status: OrderStatus;
  subtotal: number | string;
  deliveryFee: number | string;
  total: number | string;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  tableNumber?: string | number | null;
  contactPhone: string;
  paymentMethod: string;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  review?: Review | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  customerId: string;
  date: string;
  partySize: number;
  tableId?: string | null;
  tableNumber?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  status: ReservationStatus;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  customerId: string;
  orderId?: string | null;
  rating: number;
  comment: string;
  isHidden: boolean;
  customer?: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique line identifier
  menuItem: MenuItem;
  variant?: ProductVariant | null;
  addons?: ProductAddon[];
  unitPrice: number;
  quantity: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  headline?: string | null;
  subtitle?: string | null;
  description: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  deliveryEnabled: boolean;
  deliveryFee: number;
  tableCount: number;
  signatureMenuItemId?: string | null;
  signatureMenuItem?: MenuItem | null;
  footerText?: string | null;
  reservationSettings?: any;
}

export interface TableAvailability {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  totalSeats: number;
  availableSeats: number;
  timestamp?: string;
}

export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
}
