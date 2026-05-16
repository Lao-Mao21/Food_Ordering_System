import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "services";

const ServiceService = {
  getAll: () =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX),
      "Failed to fetch services."
    ),

  getOne: (id: number | string) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch service details."
    ),

  create: (data: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create service."
    ),

  update: (id: number | string, data: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, data),
      "Failed to update service."
    ),

  delete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
      "Failed to delete service."
    ),
};

export default ServiceService;
