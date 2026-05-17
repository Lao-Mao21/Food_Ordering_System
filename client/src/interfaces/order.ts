export type OrderType = "dine_in" | "takeout" | "delivery";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type PaymentMethod = "cash" | "card" | "ewallet";

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  menu_item_name: string;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  notes?: string | null;
  ordered_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderPayload {
  customer_name: string;
  customer_phone?: string | null;
  order_type: OrderType;
  payment_method: PaymentMethod;
  payment_status: Extract<PaymentStatus, "pending" | "paid">;
  discount?: number;
  notes?: string | null;
  items: Array<{
    menu_item_id: number;
    quantity: number;
  }>;
}
