export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface RevenueByDay {
  date: string;
  revenue: string | number;
  orders: number;
}

export interface TopItem {
  name: string;
  quantity_sold: number;
  revenue: string | number;
}

export interface SalesAnalytics {
  summary: SalesSummary;
  revenue_by_day: RevenueByDay[];
  top_items: TopItem[];
  range: {
    from: string;
    to: string;
  };
}
