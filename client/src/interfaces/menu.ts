export interface MenuItem {
  id: number;
  name: string;
  category: string;
  category_id?: number | null;
  description?: string | null;
  price: string | number;
  is_available: boolean;
  image_url?: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MenuItemPayload {
  name: string;
  category: string;
  category_id?: number | null;
  description?: string | null;
  price: number;
  is_available: boolean;
  image_url?: string | null;
}

export interface MenuItemDescriptionPayload {
  name: string;
  category: string;
  price?: number | null;
  image_url?: string | null;
}
