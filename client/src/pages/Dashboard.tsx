import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, Icon, LoadingSpinner } from "../components/ui";
import { InputField, Select } from "../components/ui/forms";
import { TablePagination } from "../components/ui/table/Table";
import AnalyticsService from "../services/AnalyticsService";
import MenuItemService from "../services/MenuItemService";
import OrderService from "../services/OrderService";
import { unwrapData } from "../util/apiResponse";
import type { SalesAnalytics } from "../interfaces/analytics";
import type { MenuItem } from "../interfaces/menu";
import type { Order, OrderStatus } from "../interfaces/order";

const emptyAnalytics: SalesAnalytics = {
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
  revenue_trend: { granularity: 'daily', points: [] },
  revenue_by_day: [],
  monthly_revenue: [],
  top_items: [],
  yearly_top_items: [],
  range: { from: "", to: "" },
};

type DashboardSort = "ordered_at:desc" | "ordered_at:asc" | "total:desc" | "total:asc" | "customer_name:asc";

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  preparing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<SalesAnalytics>(emptyAnalytics);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeSearch, setActiveSearch] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [activeSort, setActiveSort] = useState<DashboardSort>("ordered_at:desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsResponse, ordersResponse, menuResponse] = await Promise.all([
        AnalyticsService.getSales(),
        OrderService.getAll(),
        MenuItemService.getAll({ include_unavailable: true }),
      ]);

      setAnalytics(unwrapData<SalesAnalytics>(analyticsResponse, emptyAnalytics));
      setOrders(unwrapData<{ orders: Order[] }>(ordersResponse, { orders: [] }).orders);
      setMenuItems(unwrapData<{ menu_items: MenuItem[] }>(menuResponse, { menu_items: [] }).menu_items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((order) => !["completed", "cancelled"].includes(order.status)),
    [orders]
  );

  const filteredActiveOrders = useMemo(() => {
    const query = activeSearch.trim().toLowerCase();

    return activeOrders.filter((order) => {
      const matchesSearch = !query || [order.order_number, order.customer_name, order.customer_phone ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );
      const matchesStatus = activeStatusFilter === "all" || order.status === activeStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeOrders, activeSearch, activeStatusFilter]);

  const sortedActiveOrders = useMemo(() => {
    const [key, direction] = activeSort.split(":") as ["ordered_at" | "total" | "customer_name", "asc" | "desc"];
    const modifier = direction === "asc" ? 1 : -1;

    return [...filteredActiveOrders].sort((a, b) => {
      if (key === "total") return (Number(a.total) - Number(b.total)) * modifier;
      if (key === "ordered_at") return (new Date(a.ordered_at ?? 0).getTime() - new Date(b.ordered_at ?? 0).getTime()) * modifier;
      return a.customer_name.localeCompare(b.customer_name) * modifier;
    });
  }, [activeSort, filteredActiveOrders]);

  const totalPages = Math.max(Math.ceil(sortedActiveOrders.length / pageSize), 1);
  const paginatedActiveOrders = sortedActiveOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearch, activeSort, activeStatusFilter, pageSize]);

  const unavailableMenuItems = useMemo(
    () => menuItems.filter((item) => !item.is_available).slice(0, 5),
    [menuItems]
  );

  const stats = [
    { label: "Revenue", value: formatCurrency(analytics.summary.total_revenue), icon: "FaPesoSign" as const },
    { label: "Active Orders", value: activeOrders.length, icon: "FaReceipt" as const },
    { label: "Ready", value: analytics.summary.ready_orders, icon: "FaBell" as const },
    { label: "Menu Items", value: menuItems.length, icon: "FaUtensils" as const },
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">Food Ordering Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Admin operations overview</p>
        </div>
        <Button variant="secondary" iconName="FaRepeat" onClick={fetchData} isLoading={isLoading}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border-muted bg-bg-light py-24">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
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
              <div className="mb-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-text">Active Orders</h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{sortedActiveOrders.length}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <InputField
                    label="Search"
                    placeholder="Order, customer, phone"
                    value={activeSearch}
                    onChange={(event) => setActiveSearch(event.target.value)}
                    fullWidth
                  />
                  <Select
                    label="Status"
                    value={activeStatusFilter}
                    onChange={(event) => setActiveStatusFilter(event.target.value)}
                    options={[
                      { value: "all", label: "All active" },
                      { value: "pending", label: "Pending" },
                      { value: "preparing", label: "Preparing" },
                      { value: "ready", label: "Ready" },
                    ]}
                    fullWidth
                  />
                  <Select
                    label="Sort"
                    value={activeSort}
                    onChange={(event) => setActiveSort(event.target.value as DashboardSort)}
                    options={[
                      { value: "ordered_at:desc", label: "Newest first" },
                      { value: "ordered_at:asc", label: "Oldest first" },
                      { value: "total:desc", label: "Total high-low" },
                      { value: "total:asc", label: "Total low-high" },
                      { value: "customer_name:asc", label: "Customer A-Z" },
                    ]}
                    fullWidth
                  />
                </div>
              </div>

              {sortedActiveOrders.length === 0 ? (
                <div className="py-20 text-center text-text-muted">No active orders.</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedActiveOrders.map((order) => (
                      <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-border-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-text">{order.order_number}</p>
                          <p className="text-sm text-text-muted">{order.customer_name} - {formatCurrency(order.total)}</p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
                    onPageSizeChange={setPageSize}
                    totalResults={sortedActiveOrders.length}
                    pageSize={pageSize}
                  />
                </>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-text">Top Sellers</h2>
                {analytics.top_items.length === 0 ? (
                  <div className="py-10 text-center text-text-muted">No completed sales yet.</div>
                ) : (
                  <div className="space-y-4">
                    {analytics.top_items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
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

              <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-text">Unavailable Items</h2>
                {unavailableMenuItems.length === 0 ? (
                  <div className="py-10 text-center text-text-muted">All menu items are available.</div>
                ) : (
                  <div className="space-y-4">
                    {unavailableMenuItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{item.name}</p>
                          <p className="text-xs text-text-muted">{item.category}</p>
                        </div>
                        <p className="font-black text-danger">Unavailable</p>
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

export default Dashboard;







