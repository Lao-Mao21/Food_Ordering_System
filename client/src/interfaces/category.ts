export interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  menu_items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  name: string;
  is_active: boolean;
  sort_order?: number;
}
