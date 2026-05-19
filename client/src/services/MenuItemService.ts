import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { MenuItemDescriptionPayload, MenuItemPayload } from "../interfaces/menu";

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

  generateDescription: (data: MenuItemDescriptionPayload) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/generate-description`, data),
      "Failed to generate menu item description."
    ),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    return handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/upload-image`, formData),
      "Failed to upload menu item image."
    );
  },

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

  restore: (id: number | string) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/restore`),
      "Failed to restore menu item."
    ),

  forceDelete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}/force`),
      "Failed to permanently delete menu item."
    ),
};

export default MenuItemService;
