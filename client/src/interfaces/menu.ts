export interface MenuItem {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  price: string | number;
  stock_quantity: number;
  is_available: boolean;
  image_url?: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemPayload {
  name: string;
  category: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_url?: string | null;
}
