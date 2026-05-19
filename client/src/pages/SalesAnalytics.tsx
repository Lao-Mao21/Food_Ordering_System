import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, Icon, LoadingSpinner } from "../components/ui";
import { InputField, Select } from "../components/ui/forms";
import { TablePagination } from "../components/ui/table/Table";
import AnalyticsService from "../services/AnalyticsService";
import { unwrapData } from "../util/apiResponse";
import type { MonthlyRevenue, RevenueTrendPoint, SalesAnalytics as SalesAnalyticsData, TopItem } from "../interfaces/analytics";

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
type ChartTooltip = {
  label: string;
  revenue: string | number;
  orders: number;
  xPct: number;
  yPct: number;
  caption?: string;
};

const chartColors = ["#35477d", "#7b6f35", "#2f7d5c", "#a74d45", "#4f7396"];

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const SalesAnalytics = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsData>(emptyAnalytics);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [topItemSearch, setTopItemSearch] = useState("");
const [topItemSort, setTopItemSort] = useState<TopItemSort>("revenue:desc");
  const [itemShareScope, setItemShareScope] = useState<ItemShareScope>("range");
  const [trendTooltip, setTrendTooltip] = useState<ChartTooltip | null>(null);
  const [monthlyTooltip, setMonthlyTooltip] = useState<ChartTooltip | null>(null);
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
    const paddingX = 58;
    const right = 24;
    const top = 18;
    const baseline = 158;
    const innerWidth = width - paddingX - right;
    const innerHeight = baseline - top;

    const coords = trendPoints.map((point, index) => {
      const x = paddingX + (index / Math.max(trendPoints.length - 1, 1)) * innerWidth;
      const y = baseline - (Number(point.revenue) / maxRevenue) * innerHeight;
      return { point, x, y };
    });

    const linePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
    const areaPoints = coords.length > 0 ? `${paddingX},${baseline} ${linePoints} ${width - right},${baseline}` : "";
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
    const yLabels = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
      label: formatCurrency(maxRevenue * ratio),
      y: baseline - ratio * innerHeight,
      ratio,
    }));

    return { width, height, paddingX, right, top, baseline, linePoints, areaPoints, coords, labels, yLabels };
  }, [trendPoints, maxRevenue]);

  const maxMonthlyRevenue = useMemo(
    () => Math.max(...analytics.monthly_revenue.map((month) => Number(month.revenue)), 1),
    [analytics.monthly_revenue]
  );
  const peakMonthlyPoint = useMemo<MonthlyRevenue | null>(() => {
    if (analytics.monthly_revenue.length === 0) return null;

    return analytics.monthly_revenue.reduce((peak, month) =>
      Number(month.revenue) > Number(peak.revenue) ? month : peak
    );
  }, [analytics.monthly_revenue]);

  const monthlyChart = useMemo(() => {
    const width = 720;
    const height = 190;
    const paddingX = 58;
    const right = 24;
    const top = 20;
    const baseline = 156;
    const innerWidth = width - paddingX - right;
    const innerHeight = baseline - top;
    const values = analytics.monthly_revenue;

    const coords = values.map((month, index) => {
      const x = paddingX + (index / Math.max(values.length - 1, 1)) * innerWidth;
      const y = baseline - (Number(month.revenue) / maxMonthlyRevenue) * innerHeight;
      return { month, x, y };
    });

    const linePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
    const areaPoints = coords.length > 0 ? `${paddingX},${baseline} ${linePoints} ${width - right},${baseline}` : "";
    const yLabels = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
      label: formatCurrency(maxMonthlyRevenue * ratio),
      y: baseline - ratio * innerHeight,
      ratio,
    }));

    return { width, height, paddingX, right, top, baseline, linePoints, areaPoints, coords, yLabels };
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

  const handleExportPdf = () => {
    const reportWindow = window.open("", "_blank", "width=960,height=720");

    if (!reportWindow) return;

    const generatedAt = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
    const rangeLabel = analytics.range.from && analytics.range.to
      ? `${analytics.range.from} to ${analytics.range.to}`
      : "Current month";
    const topItemsRows = analytics.top_items.length
      ? analytics.top_items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td class="num">${item.quantity_sold}</td>
            <td class="num">${formatCurrency(item.revenue)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="empty">No completed item sales for this period.</td></tr>`;
    const trendRows = analytics.revenue_trend.points.length
      ? analytics.revenue_trend.points.map((point) => `
          <tr>
            <td>${escapeHtml(point.label)}</td>
            <td>${escapeHtml(point.period_start)} - ${escapeHtml(point.period_end)}</td>
            <td class="num">${point.orders}</td>
            <td class="num">${formatCurrency(point.revenue)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="empty">No trend data available.</td></tr>`;
    const monthlyRows = analytics.monthly_revenue.map((month) => `
      <tr>
        <td>${escapeHtml(month.month)}</td>
        <td class="num">${month.orders}</td>
        <td class="num">${formatCurrency(month.revenue)}</td>
      </tr>
    `).join("");

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Sales Analytics Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; color: #0b1736; font-family: Arial, sans-serif; background: #fff; }
            header { border-bottom: 2px solid #35477d; padding-bottom: 18px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 28px; letter-spacing: 0; }
            h2 { margin: 28px 0 10px; font-size: 18px; }
            p { margin: 6px 0; }
            .muted { color: #5c6884; font-size: 12px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0 28px; }
            .card { border: 1px solid #b7c2d8; border-radius: 8px; padding: 14px; min-height: 88px; }
            .label { color: #35477d; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .value { margin-top: 8px; font-size: 21px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { border: 1px solid #c7d0e1; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background: #edf3f8; color: #243a69; text-transform: uppercase; font-size: 11px; }
            .num { text-align: right; }
            .empty { text-align: center; color: #5c6884; padding: 18px; }
            .footer { margin-top: 28px; border-top: 1px solid #c7d0e1; padding-top: 12px; font-size: 11px; color: #5c6884; }
            @media print {
              body { padding: 20mm; }
              .summary { grid-template-columns: repeat(2, 1fr); }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <header>
            <h1>Sales Analytics Report</h1>
            <p><strong>OrderGood</strong></p>
            <p class="muted">Range: ${escapeHtml(rangeLabel)} | Generated: ${escapeHtml(generatedAt)}</p>
          </header>

          <section class="summary">
            <div class="card"><div class="label">Total Revenue</div><div class="value">${formatCurrency(analytics.summary.total_revenue)}</div></div>
            <div class="card"><div class="label">Completed Orders</div><div class="value">${analytics.summary.total_orders}</div></div>
            <div class="card"><div class="label">Average Order</div><div class="value">${formatCurrency(analytics.summary.average_order_value)}</div></div>
            <div class="card"><div class="label">Top Item</div><div class="value">${escapeHtml(analytics.top_items[0]?.name ?? "No sales")}</div></div>
          </section>

          <h2>Order Pipeline</h2>
          <table>
            <thead><tr><th>Status</th><th class="num">Orders</th></tr></thead>
            <tbody>
              <tr><td>Pending</td><td class="num">${analytics.summary.pending_orders}</td></tr>
              <tr><td>Preparing</td><td class="num">${analytics.summary.preparing_orders}</td></tr>
              <tr><td>Ready</td><td class="num">${analytics.summary.ready_orders}</td></tr>
              <tr><td>Completed</td><td class="num">${analytics.summary.completed_orders}</td></tr>
              <tr><td>Cancelled</td><td class="num">${analytics.summary.cancelled_orders}</td></tr>
            </tbody>
          </table>

          <h2>Top Items</h2>
          <table>
            <thead><tr><th>#</th><th>Item</th><th class="num">Quantity Sold</th><th class="num">Revenue</th></tr></thead>
            <tbody>${topItemsRows}</tbody>
          </table>

          <h2>Revenue Trend (${escapeHtml(analytics.revenue_trend.granularity)})</h2>
          <table>
            <thead><tr><th>Period</th><th>Date Range</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
            <tbody>${trendRows}</tbody>
          </table>

          <h2>Yearly Revenue by Month</h2>
          <table>
            <thead><tr><th>Month</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
            <tbody>${monthlyRows}</tbody>
          </table>

          <div class="footer">Generated by OrderGood.</div>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" iconName="FaFilePdf" onClick={handleExportPdf} disabled={isLoading}>
              Export PDF
            </Button>
            <Button variant="secondary" iconName="FaRepeat" onClick={() => fetchAnalytics()} isLoading={isLoading}>
              Refresh
            </Button>
          </div>
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
                    <div className="relative min-w-0 rounded-lg bg-bg-main p-3">
                      <svg
                        viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
                        className="h-60 w-full overflow-visible"
                        role="img"
                        aria-label="Revenue trend for selected date range"
                        onMouseLeave={() => setTrendTooltip(null)}
                      >
                        <defs>
                          <linearGradient id="revenueTrendFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {trendChart.yLabels.map(({ label, y, ratio }) => (
                          <g key={ratio}>
                            <line
                              x1={trendChart.paddingX}
                              x2={trendChart.width - trendChart.right}
                              y1={y}
                              y2={y}
                              className="stroke-border-muted"
                              strokeDasharray={ratio === 0 ? undefined : "4 8"}
                              strokeWidth="1"
                            />
                            <text x="50" y={y + 4} textAnchor="end" className="fill-text-muted text-[10px] font-semibold">
                              {label}
                            </text>
                          </g>
                        ))}
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
                        {trendChart.coords.map(({ point, x, y }) => {
                          const isPeak = point === peakTrendPoint && Number(point.revenue) > 0;

                          return Number(point.revenue) > 0 && (
                            <g key={`${point.period_start}-${point.period_end}`}>
                              {isPeak && (
                                <circle cx={x} cy={y} r="10" className="fill-secondary/25 stroke-secondary" strokeWidth="1.5" />
                              )}
                              <circle
                                cx={x}
                                cy={y}
                                r={isPeak ? "6" : "4.5"}
                                className="fill-secondary stroke-bg-main cursor-pointer"
                                strokeWidth="2"
                                onMouseEnter={() => setTrendTooltip({
                                  label: point.label,
                                  revenue: point.revenue,
                                  orders: point.orders,
                                  caption: `${point.period_start} to ${point.period_end}`,
                                  xPct: (x / trendChart.width) * 100,
                                  yPct: (y / trendChart.height) * 100,
                                })}
                              />
                            </g>
                          );
                        })}
                        {trendChart.labels.map((label) => (
                          <text key={`${label.label}-${label.x}`} x={label.x} y="184" textAnchor="middle" className="fill-text-muted text-[10px] font-semibold">
                            {label.label}
                          </text>
                        ))}
                      </svg>
                      {trendTooltip && (
                        <div
                          className="pointer-events-none absolute z-10 min-w-40 rounded-lg border border-border-muted bg-bg-light px-3 py-2 text-xs shadow-lg"
                          style={{
                            left: `${trendTooltip.xPct}%`,
                            top: `${trendTooltip.yPct}%`,
                            transform: "translate(-50%, calc(-100% - 12px))",
                          }}
                        >
                          <p className="font-black text-text">{trendTooltip.label}</p>
                          <p className="mt-1 text-primary font-black">{formatCurrency(trendTooltip.revenue)}</p>
                          <p className="text-text-muted">{trendTooltip.orders} orders</p>
                          <p className="text-text-muted">{trendTooltip.caption}</p>
                        </div>
                      )}
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
                    <div className="relative rounded-lg bg-bg-main p-3">
                      <svg
                        viewBox={`0 0 ${monthlyChart.width} ${monthlyChart.height}`}
                        className="h-56 w-full overflow-visible"
                        role="img"
                        aria-label="Yearly revenue by month"
                        onMouseLeave={() => setMonthlyTooltip(null)}
                      >
                        <defs>
                          <linearGradient id="monthlyRevenueFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {monthlyChart.yLabels.map(({ label, y, ratio }) => (
                          <g key={ratio}>
                            <line
                              x1={monthlyChart.paddingX}
                              x2={monthlyChart.width - monthlyChart.right}
                              y1={y}
                              y2={y}
                              className="stroke-border-muted"
                              strokeDasharray={ratio === 0 ? undefined : "4 8"}
                              strokeWidth="1"
                            />
                            <text x="50" y={y + 4} textAnchor="end" className="fill-text-muted text-[10px] font-semibold">
                              {label}
                            </text>
                          </g>
                        ))}
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
                        {monthlyChart.coords.map(({ month, x, y }) => {
                          const isPeak = month === peakMonthlyPoint && Number(month.revenue) > 0;

                          return (
                            <g key={month.month}>
                              {isPeak && (
                                <circle cx={x} cy={y} r="10" className="fill-secondary/25 stroke-secondary" strokeWidth="1.5" />
                              )}
                              <circle
                                cx={x}
                                cy={y}
                                r={isPeak ? "6" : "4.5"}
                                className="fill-secondary stroke-bg-main cursor-pointer"
                                strokeWidth="2"
                                onMouseEnter={() => setMonthlyTooltip({
                                  label: month.month,
                                  revenue: month.revenue,
                                  orders: month.orders,
                                  xPct: (x / monthlyChart.width) * 100,
                                  yPct: (y / monthlyChart.height) * 100,
                                })}
                              />
                            </g>
                          );
                        })}
                        {monthlyChart.coords.map(({ month, x }) => (
                          <text key={`${month.month}-label`} x={x} y="184" textAnchor="middle" className="fill-text-muted text-[10px] font-semibold">
                            {month.month}
                          </text>
                        ))}
                      </svg>
                      {monthlyTooltip && (
                        <div
                          className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-border-muted bg-bg-light px-3 py-2 text-xs shadow-lg"
                          style={{
                            left: `${monthlyTooltip.xPct}%`,
                            top: `${monthlyTooltip.yPct}%`,
                            transform: "translate(-50%, calc(-100% - 12px))",
                          }}
                        >
                          <p className="font-black text-text">{monthlyTooltip.label}</p>
                          <p className="mt-1 text-primary font-black">{formatCurrency(monthlyTooltip.revenue)}</p>
                          <p className="text-text-muted">{monthlyTooltip.orders} orders</p>
                        </div>
                      )}
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






