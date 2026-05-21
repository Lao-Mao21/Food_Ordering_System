import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner, Modal } from "../components/ui";
import { InputField, Select, TextArea } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TablePagination, TableRow } from "../components/ui/table/Table";
import MenuItemService from "../services/MenuItemService";
import OrderService from "../services/OrderService";
import { notify } from "../util/notify";
import { unwrapData } from "../util/apiResponse";
import type { MenuItem } from "../interfaces/menu";
import type { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../interfaces/order";

type CartLine = {
  menu_item_id: number;
  quantity: number;
};

type OrderAction = "advance" | "cancel";
type OrderSortKey = "order_number" | "customer_name" | "status" | "payment_status" | "order_type" | "total" | "ordered_at";

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

type MenuImageProps = {
  src?: string | null;
  alt: string;
};

const MenuImage = ({ src, alt }: MenuImageProps) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-lg border border-border-muted bg-primary/10 text-xs font-black text-primary">
        IMG
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-24 w-full rounded-lg border border-border-muted object-cover"
      onError={() => setHasError(true)}
    />
  );
};

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  preparing: "bg-info/10 text-info",
  ready: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentStatus, setPaymentStatus] = useState<Extract<PaymentStatus, "pending" | "paid">>("pending");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState("all");
  const [sort, setSort] = useState<{ key: OrderSortKey; direction: "asc" | "desc" }>({ key: "ordered_at", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menuCurrentPage, setMenuCurrentPage] = useState(1);
  const [menuPageSize, setMenuPageSize] = useState(10);
  const [isOrderListOpen, setIsOrderListOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<{ id: number; action: OrderAction } | null>(null);
  const [isClearFormConfirmOpen, setIsClearFormConfirmOpen] = useState(false);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersResponse, menuResponse] = await Promise.all([
        OrderService.getAll(statusFilter === "active" ? {} : { status: statusFilter }),
        MenuItemService.getAll(),
      ]);

      const orderPayload = unwrapData<{ orders: Order[] }>(ordersResponse, { orders: [] });
      const menuPayload = unwrapData<{ menu_items: MenuItem[] }>(menuResponse, { menu_items: [] });
      const visibleOrders = statusFilter === "active"
        ? orderPayload.orders.filter((order) => !["completed", "cancelled"].includes(order.status))
        : orderPayload.orders;

      setOrders(visibleOrders);
      setMenuItems(menuPayload.menu_items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const menuById = useMemo(
    () => new Map(menuItems.map((item) => [item.id, item])),
    [menuItems]
  );

  const menuCategories = useMemo(
    () => Array.from(new Set(menuItems.map((item) => item.category))).sort(),
    [menuItems]
  );

  const filteredMenuItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSearch = !query || [item.name, item.category, item.description ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [menuCategoryFilter, menuItems, menuSearch]);

  const menuTotalPages = Math.max(Math.ceil(filteredMenuItems.length / menuPageSize), 1);
  const paginatedMenuItems = filteredMenuItems.slice((menuCurrentPage - 1) * menuPageSize, menuCurrentPage * menuPageSize);

  useEffect(() => {
    setMenuCurrentPage(1);
  }, [menuCategoryFilter, menuPageSize, menuSearch]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !query || [order.order_number, order.customer_name, order.customer_phone ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );
      const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
      const matchesType = typeFilter === "all" || order.order_type === typeFilter;

      return matchesSearch && matchesPayment && matchesType;
    });
  }, [orderSearch, orders, paymentFilter, typeFilter]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;

      if (sort.key === "total") {
        return (Number(a.total) - Number(b.total)) * direction;
      }

      if (sort.key === "ordered_at") {
        return (new Date(a.ordered_at ?? 0).getTime() - new Date(b.ordered_at ?? 0).getTime()) * direction;
      }

      return String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? "")) * direction;
    });
  }, [filteredOrders, sort]);

  const totalPages = Math.max(Math.ceil(sortedOrders.length / pageSize), 1);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderSearch, pageSize, paymentFilter, sort, statusFilter, typeFilter]);

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => {
      const item = menuById.get(line.menu_item_id);
      return sum + Number(item?.price ?? 0) * line.quantity;
    }, 0);

    return Math.max(subtotal - Number(discount || 0), 0);
  }, [cart, discount, menuById]);

  const handleSort = (key: OrderSortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart((current) => {
      const existing = current.find((line) => line.menu_item_id === menuItem.id);
      if (existing) {
        return current.map((line) =>
          line.menu_item_id === menuItem.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }

      return [...current, { menu_item_id: menuItem.id, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    const nextQuantity = Math.max(1, quantity);

    setCart((current) =>
      current.map((line) =>
        line.menu_item_id === menuItemId ? { ...line, quantity: nextQuantity } : line
      )
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((current) => current.filter((line) => line.menu_item_id !== menuItemId));
  };

  const resetOrderForm = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setOrderType("dine_in");
    setPaymentMethod("cash");
    setPaymentStatus("pending");
    setDiscount(0);
    setNotes("");
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      notify.error("Customer name is required.");
      return;
    }

    if (cart.length === 0) {
      notify.error("Add at least one item.");
      return;
    }

    setIsSaving(true);
    try {
      await OrderService.create({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        order_type: orderType,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        discount: Number(discount || 0),
        notes: notes.trim() || null,
        items: cart,
      });

      notify.success("Order created.");
      resetOrderForm();
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    if (status === "pending") return "preparing";
    if (status === "preparing") return "ready";
    if (status === "ready") return "completed";
    return null;
  };

  const handleAdvanceStatus = async (order: Order) => {
    const status = nextStatus(order.status);
    if (!status) return;

    setUpdatingOrder({ id: order.id, action: "advance" });
    try {
      await OrderService.updateStatus(order.id, {
        status,
        payment_status: status === "completed" ? "paid" : order.payment_status,
      });
      notify.success(`Order marked ${status}.`);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancel = async (order: Order) => {
    setUpdatingOrder({ id: order.id, action: "cancel" });
    try {
      await OrderService.updateStatus(order.id, { status: "cancelled" });
      notify.success("Order cancelled.");
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-text">Orders</h1>
            <p className="mt-1 text-sm text-text-muted">{sortedOrders.length} of {orders.length} orders in view</p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchData} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InputField
            label="Search"
            placeholder="Order, customer, phone"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
            fullWidth
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "preparing", label: "Preparing" },
              { value: "ready", label: "Ready" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            fullWidth
          />
          <Select
            label="Payment"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            options={[
              { value: "all", label: "All payments" },
              { value: "pending", label: "Pending" },
              { value: "paid", label: "Paid" },
              { value: "refunded", label: "Refunded" },
            ]}
            fullWidth
          />
          <Select
            label="Type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[
              { value: "all", label: "All types" },
              { value: "dine_in", label: "Dine in" },
              { value: "takeout", label: "Takeout" },
              { value: "delivery", label: "Delivery" },
            ]}
            fullWidth
          />
          <Select
            label="Sort"
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(":") as [OrderSortKey, "asc" | "desc"];
              setSort({ key, direction });
            }}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-text">Create Order</h2>
              <Button
                variant="ghost"
                size="sm"
                iconName="FaRotateLeft"
                onClick={() => setIsClearFormConfirmOpen(true)}
                disabled={isSaving}
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-4">
              <InputField label="Customer" value={customerName} onChange={(event) => setCustomerName(event.target.value)} fullWidth required />
              <InputField label="Phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} fullWidth />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Type"
                  value={orderType}
                  onChange={(event) => setOrderType(event.target.value as OrderType)}
                  options={[
                    { value: "dine_in", label: "Dine in" },
                    { value: "takeout", label: "Takeout" },
                    { value: "delivery", label: "Delivery" },
                  ]}
                  fullWidth
                />
                <Select
                  label="Payment"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "ewallet", label: "E-wallet" },
                  ]}
                  fullWidth
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value as Extract<PaymentStatus, "pending" | "paid">)}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "paid", label: "Paid" },
                  ]}
                  fullWidth
                />
                <InputField label="Discount" type="number" min={0} step="0.01" value={String(discount)} onChange={(event) => setDiscount(Number(event.target.value))} fullWidth />
              </div>
              <TextArea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} fullWidth />
            </div>
          </div>
          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-text">Cart</h2>
                <p className="mt-1 text-xs text-text-muted">{cart.length} item{cart.length === 1 ? "" : "s" } selected</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-primary">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-lg border border-border-muted p-6 text-center text-sm text-text-muted">No items selected.</div>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {cart.map((line) => {
                  const item = menuById.get(line.menu_item_id);
                  if (!item) return null;

                  return (
                    <div key={line.menu_item_id} className="rounded-lg border border-border-muted p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{item.name}</p>
                          <p className="text-xs text-text-muted">{formatCurrency(item.price)}</p>
                        </div>
                        <Button variant="ghost" size="sm" iconName="FaXmark" onClick={() => removeFromCart(line.menu_item_id)} />
                      </div>
                      <InputField
                        label="Quantity"
                        type="number"
                        min={1}
                        value={String(line.quantity)}
                        onChange={(event) => updateQuantity(line.menu_item_id, Number(event.target.value))}
                        fullWidth
                      />
                    </div>
                  );
                })}
              </div>
            )}
  
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Button iconName="FaReceipt" onClick={handleCreateOrder} isLoading={isSaving} fullWidth>
                Create Order
              </Button>
              <Button
                variant="ghost"
                iconName="FaXmark"
                onClick={() => setIsClearCartConfirmOpen(true)}
                disabled={cart.length === 0 || isSaving}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="text-xl font-black text-text mb-5 ml-2">Menu</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
                <InputField
                  label="Search menu"
                  placeholder="Item or category"
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  fullWidth
                />
                <Select
                  label="Category"
                  value={menuCategoryFilter}
                  onChange={(event) => setMenuCategoryFilter(event.target.value)}
                  options={[
                    { value: "all", label: "All categories" },
                    ...menuCategories.map((category) => ({ value: category, label: category })),
                  ]}
                  fullWidth
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {paginatedMenuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.is_available}
                  onClick={() => addToCart(item)}
                  className="rounded-lg border border-border-muted bg-bg-main p-3 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MenuImage src={item.image_url} alt={item.name} />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-text">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-text-muted">{item.category}</p>
                    </div>
                    <p className="font-black text-primary">{formatCurrency(item.price)}</p>
                  </div>
                </button>
              ))}
            </div>
            <TablePagination
              currentPage={menuCurrentPage}
              totalPages={menuTotalPages}
              onPageChange={(page) => setMenuCurrentPage(Math.min(Math.max(page, 1), menuTotalPages))}
              onPageSizeChange={setMenuPageSize}
              totalResults={filteredMenuItems.length}
              pageSize={menuPageSize}
            />
          </div>
        </div>
        
        <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-text">Order List</h2>
              <p className="mt-1 text-sm text-text-muted">{sortedOrders.length} of {orders.length} orders match your filters</p>
            </div>
            <Button
              variant="outline"
              iconName={isOrderListOpen ? "FaChevronUp" : "FaChevronDown"}
              onClick={() => setIsOrderListOpen((current) => !current)}
            >
              {isOrderListOpen ? "Collapse" : "Show Orders"}
            </Button>
          </div>
            {!isOrderListOpen ? (
              <div className="rounded-lg border border-border-muted bg-bg-main p-6 text-center text-sm text-text-muted">
                Order list is collapsed so the page stays compact. Open it when you need to review or update orders.
              </div>
            ) : isLoading ? (
              <div className="py-20">
                <LoadingSpinner size="lg" text="Loading orders..." />
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="py-20 text-center text-text-muted">No orders found.</div>
            ) : (
              <>
                <div className="max-h-[34rem] overflow-y-auto pr-1">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader sortKey="order_number" currentSort={sort} onSort={handleSort}>Order</TableCell>
                      <TableCell isHeader sortKey="customer_name" currentSort={sort} onSort={handleSort}>Customer</TableCell>
                      <TableCell isHeader sortKey="status" currentSort={sort} onSort={handleSort}>Status</TableCell>
                      <TableCell isHeader sortKey="payment_status" currentSort={sort} onSort={handleSort}>Payment</TableCell>
                      <TableCell isHeader align="right" sortKey="total" currentSort={sort} onSort={handleSort}>Total</TableCell>
                      <TableCell isHeader align="center">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => {
                      const advanceTo = nextStatus(order.status);

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <p className="font-bold">{order.order_number}</p>
                              <p className="text-xs text-text-muted">{order.order_type.replace("_", " ")}</p>
                            </div>
                          </TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>{order.payment_status}</TableCell>
                          <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                          <TableCell align="center">
                            <div className="flex justify-center gap-2">
                              {advanceTo && (
                                <Button
                                  size="sm"
                                  iconName="FaArrowRight"
                                  onClick={() => handleAdvanceStatus(order)}
                                  isLoading={updatingOrder?.id === order.id && updatingOrder.action === "advance"}
                                >
                                  {advanceTo}
                                </Button>
                              )}
                              {!["completed", "cancelled"].includes(order.status) && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  iconName="FaXmark"
                                  onClick={() => handleCancel(order)}
                                  isLoading={updatingOrder?.id === order.id && updatingOrder.action === "cancel"}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
                  onPageSizeChange={setPageSize}
                  totalResults={sortedOrders.length}
                  pageSize={pageSize}
                />
              </>
            )}
          </div>
      </div>

      <Modal
        isOpen={isClearFormConfirmOpen}
        onClose={() => setIsClearFormConfirmOpen(false)}
        title="Clear Order Form"
        size="sm"
        primaryAction={{
          label: "Clear All",
          onClick: () => {
            resetOrderForm();
            setIsClearFormConfirmOpen(false);
          },
          variant: "danger",
          iconName: "FaRotateLeft",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setIsClearFormConfirmOpen(false),
          variant: "ghost",
        }}
      >
        <div className="not-italic text-sm leading-relaxed text-text-muted">
          Clear the customer details, order options, notes, discount, and cart?
        </div>
      </Modal>

      <Modal
        isOpen={isClearCartConfirmOpen}
        onClose={() => setIsClearCartConfirmOpen(false)}
        title="Clear Cart"
        size="sm"
        primaryAction={{
          label: "Clear Cart",
          onClick: () => {
            clearCart();
            setIsClearCartConfirmOpen(false);
          },
          variant: "danger",
          iconName: "FaXmark",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setIsClearCartConfirmOpen(false),
          variant: "ghost",
        }}
      >
        <div className="not-italic text-sm leading-relaxed text-text-muted">
          Remove all selected menu items from the cart?
        </div>
      </Modal>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Orders;




