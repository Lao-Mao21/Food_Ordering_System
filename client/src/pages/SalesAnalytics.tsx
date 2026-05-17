import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, Icon, LoadingSpinner } from "../components/ui";
import AnalyticsService from "../services/AnalyticsService";
import { unwrapData } from "../util/apiResponse";
import type { SalesAnalytics as SalesAnalyticsData } from "../interfaces/analytics";

const emptyAnalytics: SalesAnalyticsData = {
  summary: {
    total_revenue: 0,
    total_orders: 0,
    average_order_value: 0,
    pending_orders: 0,
    preparing_orders: 0,
    ready_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
  },
  revenue_by_day: [],
  top_items: [],
  range: {
    from: "",
    to: "",
  },
};

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const SalesAnalytics = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsData>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await AnalyticsService.getSales();
      setAnalytics(unwrapData<SalesAnalyticsData>(response, emptyAnalytics));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...analytics.revenue_by_day.map((day) => Number(day.revenue)), 1),
    [analytics.revenue_by_day]
  );

  const statCards = [
    { label: "Revenue", value: formatCurrency(analytics.summary.total_revenue), icon: "FaPesoSign" as const },
    { label: "Completed", value: analytics.summary.completed_orders, icon: "FaCircleCheck" as const },
    { label: "Average", value: formatCurrency(analytics.summary.average_order_value), icon: "FaChartSimple" as const },
    { label: "Cancelled", value: analytics.summary.cancelled_orders, icon: "FaCircleXmark" as const },
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">Sales Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            {analytics.range.from && analytics.range.to ? `${analytics.range.from} to ${analytics.range.to}` : "Last 30 days"}
          </p>
        </div>
        <Button variant="secondary" iconName="FaRepeat" onClick={fetchAnalytics} isLoading={isLoading}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border-muted bg-bg-light py-24">
          <LoadingSpinner size="lg" text="Loading analytics..." />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon iconName={stat.icon} size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black text-text">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
              <h2 className="mb-5 text-xl font-black text-text">Revenue Trend</h2>
              {analytics.revenue_by_day.length === 0 ? (
                <div className="py-20 text-center text-text-muted">No completed sales in this period.</div>
              ) : (
                <div className="flex h-72 items-stretch gap-3 border-b border-border-muted pb-4">
                  {analytics.revenue_by_day.map((day) => {
                    const revenue = Number(day.revenue);
                    const height = Math.max((revenue / maxRevenue) * 100, 8);

                    return (
                      <div key={day.date} className="flex min-w-10 flex-1 flex-col items-center gap-2">
                        <div className="relative flex h-full w-full items-end rounded-t bg-primary/10">
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-muted">
                            {formatCurrency(revenue)}
                          </span>
                          <div
                            className="w-full rounded-t bg-primary transition-all"
                            style={{ height: `${height}%` }}
                            title={`${day.date}: ${formatCurrency(day.revenue)}`}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted">{new Date(day.date).getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-text">Order Pipeline</h2>
                {([
                  ["Pending", analytics.summary.pending_orders],
                  ["Preparing", analytics.summary.preparing_orders],
                  ["Ready", analytics.summary.ready_orders],
                ] as const).map(([label, value]) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-text">{label}</span>
                      <span className="font-black text-primary">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-main">
                      <div
                        className="h-2 rounded-full bg-secondary"
                        style={{ width: `${Math.min(value * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-text">Top Items</h2>
                {analytics.top_items.length === 0 ? (
                  <div className="py-10 text-center text-text-muted">No item sales yet.</div>
                ) : (
                  <div className="space-y-4">
                    {analytics.top_items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-text">{item.name}</p>
                          <p className="text-xs text-text-muted">{item.quantity_sold} sold</p>
                        </div>
                        <p className="font-black text-primary">{formatCurrency(item.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return <MainLayout content={content} />;
};

export default SalesAnalytics;
