import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { MenuItemPayload } from "../interfaces/menu";

const BASE_PREFIX = "menu-items";

const MenuItemService = {
  getAll: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch menu items."
    ),

  getOne: (id: number | string) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch menu item details."
    ),

  create: (data: MenuItemPayload) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create menu item."
    ),

  update: (id: number | string, data: MenuItemPayload) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, data),
      "Failed to update menu item."
    ),

  delete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
      "Failed to delete menu item."
    ),
};

export default MenuItemService;
