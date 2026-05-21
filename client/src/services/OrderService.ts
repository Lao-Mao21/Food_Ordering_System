import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { OrderPayload, OrderStatus, PaymentStatus } from "../interfaces/order";

const BASE_PREFIX = "orders";

const OrderService = {
  getAll: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch orders."
    ),

  getOne: (id: number | string) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch order details."
    ),

  create: (data: OrderPayload) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create order."
    ),

  update: (id: number | string, data: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, data),
      "Failed to update order."
    ),

  updateStatus: (id: number | string, data: { status: OrderStatus; payment_status?: PaymentStatus }) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/status`, data),
      "Failed to update order status."
    ),

  cleanNote: (data: { note: string }) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/notes/clean`, data),
      "Failed to fix order note grammar."
    ),

};

export default OrderService;
