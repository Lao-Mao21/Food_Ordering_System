export type QueueStatus = "pending" | "serving" | "completed" | "skipped";

export interface Queue {
  id: number;
  queue_number: number;
  service_id: number;
  service_name?: string;
  status: QueueStatus;
  priority: number;
  notes?: string;
  served_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
