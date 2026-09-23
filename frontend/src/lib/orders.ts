export type OrderItem = {
  productSlug?: string;
  name: string;
  image: string;
  size: string | null;
  unitPrice?: number;
  quantity: number;
  lineTotal: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "cash_on_delivery";
  paymentStatus: "unpaid" | "paid" | "refunded";
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    district: string;
    city: string;
    postalCode: string | null;
  };
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type OrderTracking = Pick<
  Order,
  "orderNumber" | "status" | "trackingNumber" | "shippedAt" | "deliveredAt" | "createdAt" | "total" | "items"
>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
};
