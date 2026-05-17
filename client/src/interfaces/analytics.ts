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

export interface RevenueTrendPoint {
  label: string;
  period_start: string;
  period_end: string;
  revenue: string | number;
  orders: number;
}

export interface RevenueTrend {
  granularity: 'daily' | 'weekly' | 'monthly';
  points: RevenueTrendPoint[];
}

export interface MonthlyRevenue {
  month: string;
  month_number: number;
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
  revenue_trend: RevenueTrend;
  revenue_by_day: RevenueByDay[];
  monthly_revenue: MonthlyRevenue[];
  top_items: TopItem[];
  yearly_top_items: TopItem[];
  range: {
    from: string;
    to: string;
  };
}

