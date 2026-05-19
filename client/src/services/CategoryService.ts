import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { CategoryPayload } from "../interfaces/category";

const BASE_PREFIX = "categories";

const CategoryService = {
  getAll: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch categories."
    ),

  create: (data: CategoryPayload) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create category."
    ),

  update: (id: number | string, data: CategoryPayload) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, data),
      "Failed to update category."
    ),

  delete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
      "Failed to delete category."
    ),

  restore: (id: number | string) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/restore`),
      "Failed to restore category."
    ),

  forceDelete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}/force`),
      "Failed to permanently delete category."
    ),
};

export default CategoryService;
