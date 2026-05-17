import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner } from "../components/ui";
import { InputField, Select, TextArea } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table/Table";
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

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<{ id: number; action: OrderAction } | null>(null);

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

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => {
      const item = menuById.get(line.menu_item_id);
      return sum + Number(item?.price ?? 0) * line.quantity;
    }, 0);

    return Math.max(subtotal - Number(discount || 0), 0);
  }, [cart, discount, menuById]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((current) => {
      const existing = current.find((line) => line.menu_item_id === menuItem.id);
      if (existing) {
        return current.map((line) =>
          line.menu_item_id === menuItem.id
            ? { ...line, quantity: Math.min(line.quantity + 1, menuItem.stock_quantity) }
            : line
        );
      }

      return [...current, { menu_item_id: menuItem.id, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    const item = menuById.get(menuItemId);
    const nextQuantity = Math.max(1, Math.min(quantity, item?.stock_quantity ?? quantity));

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
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">Orders</h1>
          <p className="mt-1 text-sm text-text-muted">{orders.length} orders in view</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
          />
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchData} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-text">New Order</h2>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-text">Cart</h2>
              <span className="text-lg font-black text-primary">{formatCurrency(cartTotal)}</span>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-lg border border-border-muted p-6 text-center text-sm text-text-muted">No items selected.</div>
            ) : (
              <div className="space-y-3">
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
                        max={item.stock_quantity}
                        value={String(line.quantity)}
                        onChange={(event) => updateQuantity(line.menu_item_id, Number(event.target.value))}
                        fullWidth
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <Button className="mt-4" iconName="FaReceipt" onClick={handleCreateOrder} isLoading={isSaving} fullWidth>
              Create Order
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-text">Menu</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.stock_quantity === 0}
                  onClick={() => addToCart(item)}
                  className="rounded-lg border border-border-muted bg-bg-main p-4 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-text">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-text-muted">{item.category}</p>
                    </div>
                    <p className="font-black text-primary">{formatCurrency(item.price)}</p>
                  </div>
                  <p className="mt-3 text-xs text-text-muted">Stock {item.stock_quantity}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
            {isLoading ? (
              <div className="py-20">
                <LoadingSpinner size="lg" text="Loading orders..." />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center text-text-muted">No orders found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Order</TableCell>
                    <TableCell isHeader>Customer</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader align="right">Total</TableCell>
                    <TableCell isHeader align="center">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
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
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Orders;
