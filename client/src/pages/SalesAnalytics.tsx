import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, Icon, LoadingSpinner } from "../components/ui";
import { InputField, Select } from "../components/ui/forms";
import { TablePagination } from "../components/ui/table/Table";
import AnalyticsService from "../services/AnalyticsService";
import { unwrapData } from "../util/apiResponse";
import type { RevenueTrendPoint, SalesAnalytics as SalesAnalyticsData, TopItem } from "../interfaces/analytics";

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
  revenue_trend: { granularity: "daily", points: [] },
  revenue_by_day: [],
  monthly_revenue: [],
top_items: [],
  yearly_top_items: [],
  range: {
    from: "",
    to: "",
  },
};

type TopItemSort = "revenue:desc" | "revenue:asc" | "quantity_sold:desc" | "quantity_sold:asc" | "name:asc";
type ItemShareScope = "range" | "year";

const chartColors = ["#35477d", "#7b6f35", "#2f7d5c", "#a74d45", "#4f7396"];

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const SalesAnalytics = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsData>(emptyAnalytics);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [topItemSearch, setTopItemSearch] = useState("");
const [topItemSort, setTopItemSort] = useState<TopItemSort>("revenue:desc");
  const [itemShareScope, setItemShareScope] = useState<ItemShareScope>("range");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (override?: { from?: string; to?: string }) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      const from = override?.from ?? fromDate;
      const to = override?.to ?? toDate;

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await AnalyticsService.getSales(params);
      const payload = unwrapData<SalesAnalyticsData>(response, emptyAnalytics);
setAnalytics({
        ...payload,
        revenue_trend: payload.revenue_trend ?? emptyAnalytics.revenue_trend,
        top_items: payload.top_items ?? emptyAnalytics.top_items,
        yearly_top_items: payload.yearly_top_items ?? emptyAnalytics.yearly_top_items,
      });
      setFromDate(payload.range.from);
      setToDate(payload.range.to);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendPoints = analytics.revenue_trend.points;

  const trendValues = useMemo(() => trendPoints.map((point) => Number(point.revenue)), [trendPoints]);
  const hasTrendRevenue = useMemo(() => trendValues.some((value) => value > 0), [trendValues]);
  const maxRevenue = useMemo(() => Math.max(...trendValues, 1), [trendValues]);
  const trendOrderCount = useMemo(
    () => trendPoints.reduce((sum, point) => sum + Number(point.orders), 0),
    [trendPoints]
  );
  const peakTrendPoint = useMemo<RevenueTrendPoint | null>(() => {
    if (trendPoints.length === 0) return null;

    return trendPoints.reduce((peak, point) =>
      Number(point.revenue) > Number(peak.revenue) ? point : peak
    );
  }, [trendPoints]);

  const trendChart = useMemo(() => {
    const width = 720;
    const height = 190;
    const paddingX = 24;
    const top = 18;
    const baseline = 158;
    const innerWidth = width - paddingX * 2;
    const innerHeight = baseline - top;

    const coords = trendPoints.map((point, index) => {
      const x = paddingX + (index / Math.max(trendPoints.length - 1, 1)) * innerWidth;
      const y = baseline - (Number(point.revenue) / maxRevenue) * innerHeight;
      return { point, x, y };
    });

    const linePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
    const areaPoints = coords.length > 0 ? `${paddingX},${baseline} ${linePoints} ${width - paddingX},${baseline}` : "";
    const labelCount = Math.min(trendPoints.length, trendPoints.length > 12 ? 6 : trendPoints.length);
    const labelIndexes = new Set(
      Array.from({ length: labelCount }, (_, index) =>
        Math.round((index * (trendPoints.length - 1)) / Math.max(labelCount - 1, 1))
      )
    );
    const labels = Array.from(labelIndexes).map((index) => ({
      label: trendPoints[index]?.label ?? "",
      x: coords[index]?.x ?? paddingX,
    }));

    return { width, height, top, baseline, linePoints, areaPoints, coords, labels };
  }, [trendPoints, maxRevenue]);

  const maxMonthlyRevenue = useMemo(
    () => Math.max(...analytics.monthly_revenue.map((month) => Number(month.revenue)), 1),
    [analytics.monthly_revenue]
  );

  const monthlyChart = useMemo(() => {
    const width = 720;
    const height = 190;
    const paddingX = 28;
    const top = 20;
    const baseline = 156;
    const innerWidth = width - paddingX * 2;
    const innerHeight = baseline - top;
    const values = analytics.monthly_revenue;

    const coords = values.map((month, index) => {
      const x = paddingX + (index / Math.max(values.length - 1, 1)) * innerWidth;
      const y = baseline - (Number(month.revenue) / maxMonthlyRevenue) * innerHeight;
      return { month, x, y };
    });

    const linePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
    const areaPoints = coords.length > 0 ? `${paddingX},${baseline} ${linePoints} ${width - paddingX},${baseline}` : "";

    return { width, height, top, baseline, linePoints, areaPoints, coords };
  }, [analytics.monthly_revenue, maxMonthlyRevenue]);

  const itemShareItems = useMemo(
    () => (itemShareScope === "year" ? analytics.yearly_top_items : analytics.top_items),
    [analytics.top_items, analytics.yearly_top_items, itemShareScope]
  );
  const popularItems = useMemo(() => itemShareItems.slice(0, 5), [itemShareItems]);
  const totalPopularQuantity = useMemo(
    () => popularItems.reduce((sum, item) => sum + Number(item.quantity_sold), 0),
    [popularItems]
  );

  const popularityGradient = useMemo(() => {
    if (totalPopularQuantity === 0) return "conic-gradient(#d9e1ea 0deg 360deg)";

    let current = 0;
    const segments = popularItems.map((item, index) => {
      const start = current;
      const degrees = (Number(item.quantity_sold) / totalPopularQuantity) * 360;
      current += degrees;
      return `${chartColors[index % chartColors.length]} ${start}deg ${current}deg`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [popularItems, totalPopularQuantity]);

  const filteredTopItems = useMemo(() => {
    const query = topItemSearch.trim().toLowerCase();
    return analytics.top_items.filter((item) => !query || item.name.toLowerCase().includes(query));
  }, [analytics.top_items, topItemSearch]);

  const sortedTopItems = useMemo(() => {
    const [key, direction] = topItemSort.split(":") as [keyof TopItem, "asc" | "desc"];
    const modifier = direction === "asc" ? 1 : -1;

    return [...filteredTopItems].sort((a, b) => {
      if (key === "name") return a.name.localeCompare(b.name) * modifier;
      return (Number(a[key]) - Number(b[key])) * modifier;
    });
  }, [filteredTopItems, topItemSort]);

  const totalPages = Math.max(Math.ceil(sortedTopItems.length / pageSize), 1);
  const paginatedTopItems = sortedTopItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, topItemSearch, topItemSort]);

const itemShareYear = analytics.range.to ? new Date(analytics.range.to).getFullYear() : new Date().getFullYear();
  const itemShareCaption = itemShareScope === "year"
    ? `Completed sales in ${itemShareYear}.`
    : "Completed sales in selected range.";

  const statCards = [
    { label: "Revenue", value: formatCurrency(analytics.summary.total_revenue), icon: "FaPesoSign" as const, caption: "Selected range" },
    { label: "Sales Orders", value: analytics.summary.total_orders, icon: "FaReceipt" as const, caption: "Completed orders in selected range" },
    { label: "Average Order", value: formatCurrency(analytics.summary.average_order_value), icon: "FaChartSimple" as const, caption: "Completed orders in selected range" },
    { label: "Top Item", value: analytics.top_items[0]?.name ?? "No sales", icon: "FaUtensils" as const, valueClassName: "text-lg", caption: "Selected range" },
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-text">Sales Analytics</h1>
            <p className="mt-1 text-sm text-text-muted">
              {analytics.range.from && analytics.range.to ? `${analytics.range.from} to ${analytics.range.to}` : "Current month"}
            </p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={() => fetchAnalytics()} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="From" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} fullWidth />
          <InputField label="To" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} fullWidth />
          <Button className="self-end" iconName="FaFilter" onClick={() => fetchAnalytics()} isLoading={isLoading} fullWidth>
            Apply
          </Button>
          <Button
            className="self-end"
            variant="ghost"
            iconName="FaRotateLeft"
            onClick={() => {
              setFromDate("");
              setToDate("");
              fetchAnalytics({ from: "", to: "" });
            }}
            fullWidth
          >
            Reset
          </Button>
        </div>
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
<p className={`mt-1 font-black text-text ${stat.valueClassName ?? "text-2xl"}`}>{stat.value}</p>
                    <p className="mt-1 text-xs text-text-muted">{stat.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-text">Revenue Trend</h2>
                    <p className="mt-1 text-xs text-text-muted">Based on the selected From and To dates.</p>
                  </div>
                  <span className="rounded-full border border-border-muted px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                    {analytics.revenue_trend.granularity}
                  </span>
                </div>
                {!hasTrendRevenue ? (
                  <div className="flex h-56 flex-col items-center justify-center rounded-lg bg-bg-main px-4 text-center">
                    <p className="font-bold text-text">No completed sales in this period.</p>
                    <p className="mt-2 max-w-md text-sm text-text-muted">
                      Try a range with completed orders, or seed more completed demo orders for this date window.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_12rem]">
                    <div className="min-w-0 rounded-lg bg-bg-main p-3">
                      <svg
                        viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
                        className="h-60 w-full overflow-visible"
                        role="img"
                        aria-label="Revenue trend for selected date range"
                      >
                        <defs>
                          <linearGradient id="revenueTrendFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = trendChart.baseline - ratio * (trendChart.baseline - trendChart.top);
                          return (
                            <line
                              key={ratio}
                              x1="24"
                              x2="696"
                              y1={y}
                              y2={y}
                              className="stroke-border-muted"
                              strokeDasharray={ratio === 0 ? undefined : "4 8"}
                              strokeWidth="1"
                            />
                          );
                        })}
                        <polygon points={trendChart.areaPoints} className="text-primary" fill="url(#revenueTrendFill)" />
                        <polyline
                          points={trendChart.linePoints}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        />
                        {trendChart.coords.map(({ point, x, y }) => (
                          Number(point.revenue) > 0 && (
                            <circle key={`${point.period_start}-${point.period_end}`} cx={x} cy={y} r="4.5" className="fill-secondary stroke-bg-main" strokeWidth="2">
                              <title>{`${point.label}: ${formatCurrency(point.revenue)} (${point.orders} orders)`}</title>
                            </circle>
                          )
                        ))}
                        {trendChart.labels.map((label) => (
                          <text key={`${label.label}-${label.x}`} x={label.x} y="184" textAnchor="middle" className="fill-text-muted text-[10px] font-semibold">
                            {label.label}
                          </text>
                        ))}
                      </svg>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-lg border border-border-muted p-4">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Range Revenue</p>
                        <p className="mt-1 text-lg font-black text-text">{formatCurrency(analytics.summary.total_revenue)}</p>
                      </div>
                      <div className="rounded-lg border border-border-muted p-4">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Peak Period</p>
                        <p className="mt-1 text-lg font-black text-text">{peakTrendPoint?.label ?? "-"}</p>
                        <p className="text-xs text-text-muted">{formatCurrency(peakTrendPoint?.revenue ?? 0)}</p>
                      </div>
                      <div className="rounded-lg border border-border-muted p-4">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Orders Plotted</p>
                        <p className="mt-1 text-lg font-black text-text">{trendOrderCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-text">Popular Item Share</h2>
                      <p className="mt-1 text-xs text-text-muted">{itemShareCaption}</p>
                    </div>
                    <div className="w-full sm:w-44">
                      <Select
                        label="Scope"
                        value={itemShareScope}
                        onChange={(event) => setItemShareScope(event.target.value as ItemShareScope)}
                        options={[
                          { value: "range", label: "Selected range" },
                          { value: "year", label: `Year ${itemShareYear}` },
                        ]}
                        fullWidth
                      />
                    </div>
                  </div>
                  {popularItems.length === 0 ? (
                    <div className="py-14 text-center text-text-muted">No item sales yet.</div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-center">
                      <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: popularityGradient }}>
<div className="absolute inset-8 rounded-full bg-bg-light" aria-hidden="true" />
                      </div>
                      <div className="space-y-3">
                        {popularItems.map((item, index) => {
                          const percent = totalPopularQuantity > 0 ? (Number(item.quantity_sold) / totalPopularQuantity) * 100 : 0;
                          return (
                            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                                <span className="truncate font-semibold text-text">{item.name}</span>
                              </div>
                              <span className="font-black text-primary">{percent.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                  <h2 className="mb-5 text-xl font-black text-text">Yearly Revenue</h2>
                  {analytics.monthly_revenue.length === 0 ? (
                    <div className="py-14 text-center text-text-muted">No yearly revenue data.</div>
                  ) : (
                    <div className="rounded-lg bg-bg-main p-3">
                      <svg
                        viewBox={`0 0 ${monthlyChart.width} ${monthlyChart.height}`}
                        className="h-56 w-full overflow-visible"
                        role="img"
                        aria-label="Yearly revenue by month"
                      >
                        <defs>
                          <linearGradient id="monthlyRevenueFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = monthlyChart.baseline - ratio * (monthlyChart.baseline - monthlyChart.top);
                          return (
                            <line
                              key={ratio}
                              x1="28"
                              x2="692"
                              y1={y}
                              y2={y}
                              className="stroke-border-muted"
                              strokeDasharray={ratio === 0 ? undefined : "4 8"}
                              strokeWidth="1"
                            />
                          );
                        })}
                        <polygon points={monthlyChart.areaPoints} className="text-primary" fill="url(#monthlyRevenueFill)" />
                        <polyline
                          points={monthlyChart.linePoints}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        />
                        {monthlyChart.coords.map(({ month, x, y }) => (
                          <circle key={month.month} cx={x} cy={y} r="4.5" className="fill-secondary stroke-bg-main" strokeWidth="2">
                            <title>{`${month.month}: ${formatCurrency(month.revenue)}`}</title>
                          </circle>
                        ))}
                        {monthlyChart.coords.map(({ month, x }) => (
                          <text key={`${month.month}-label`} x={x} y="184" textAnchor="middle" className="fill-text-muted text-[10px] font-semibold">
                            {month.month}
                          </text>
                        ))}
                      </svg>
                    </div>
                  )}
                </div>
              </div>
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
                <div className="mb-5 space-y-3">
                  <div>
                    <h2 className="text-xl font-black text-text">Top Items</h2>
                    <p className="mt-1 text-xs text-text-muted">Completed sales in selected range.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                    <InputField
                      label="Search"
                      placeholder="Menu item"
                      value={topItemSearch}
                      onChange={(event) => setTopItemSearch(event.target.value)}
                      fullWidth
                    />
                    <Select
                      label="Sort"
                      value={topItemSort}
                      onChange={(event) => setTopItemSort(event.target.value as TopItemSort)}
                      options={[
                        { value: "revenue:desc", label: "Revenue high-low" },
                        { value: "revenue:asc", label: "Revenue low-high" },
                        { value: "quantity_sold:desc", label: "Sold high-low" },
                        { value: "quantity_sold:asc", label: "Sold low-high" },
                        { value: "name:asc", label: "Name A-Z" },
                      ]}
                      fullWidth
                    />
                  </div>
                </div>
                {sortedTopItems.length === 0 ? (
                  <div className="py-10 text-center text-text-muted">No item sales yet.</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedTopItems.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-text">{item.name}</p>
                            <p className="text-xs text-text-muted">{item.quantity_sold} sold</p>
                          </div>
                          <p className="font-black text-primary">{formatCurrency(item.revenue)}</p>
                        </div>
                      ))}
                    </div>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
                      onPageSizeChange={setPageSize}
                      totalResults={sortedTopItems.length}
                      pageSize={pageSize}
                    />
                  </>
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





