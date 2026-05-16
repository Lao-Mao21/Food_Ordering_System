export interface Service {
  id: number;
  name: string;
  description?: string;
  counter_number: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}
