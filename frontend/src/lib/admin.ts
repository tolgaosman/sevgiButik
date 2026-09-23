/**
 * Shapes returned by /api/admin/* — the raw Eloquent models, not the
 * storefront's ProductResource/CategoryResource contract. Kept separate from
 * lib/products.ts and lib/orders.ts on purpose: the admin panel edits fields
 * (price_minor, is_active, variant stock, ...) the public API never exposes.
 */

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  parent_name: string | null;
  href: string;
  image: string;
  itemCount: number;
};

export type AdminProductVariant = {
  id: number;
  size: string | null;
  sku: string | null;
  stock: number;
  price_minor: number | null;
  is_active: boolean;
};

export type AdminProductImage = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

export type AdminProductCategoryRef = {
  id: number;
  name: string;
  slug: string;
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_minor: number;
  compare_at_price_minor: number | null;
  image: string;
  has_sizes: boolean;
  is_new: boolean;
  is_active: boolean;
  gender: "kadin" | "erkek" | "unisex" | null;
  position: number;
  created_at: string | null;
  categories: AdminProductCategoryRef[];
  variants: AdminProductVariant[];
  images: AdminProductImage[];
};

export type AdminOrderLineItem = {
  name: string;
  slug: string | null;
  image: string;
  size: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type AdminOrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type AdminPaymentStatus = "unpaid" | "paid" | "refunded";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  createdAt: string | null;
  status: AdminOrderStatus;
  paymentMethod: "cash_on_delivery";
  paymentStatus: AdminPaymentStatus;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  customerNote: string | null;
  adminNote: string | null;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    district: string;
    city: string;
    postalCode: string | null;
  };
  subtotal: number;
  shipping: number;
  discount: number;
  total: string;
  totalValue: number;
  items: number;
  lineItems: AdminOrderLineItem[];
};

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  joined: string;
  orders: number;
  spent: string;
};

export type AdminReview = {
  id: number;
  productName: string | null;
  productSlug: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
};
