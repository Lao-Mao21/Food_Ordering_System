import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "queues";

const QueueService = {
  getAll: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch queue items."
    ),

  getOne: (id: number | string) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch queue details."
    ),

  create: (data: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create queue ticket."
    ),

  serve: (id: number | string) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/serve`),
      "Failed to call next queue ticket."
    ),

  complete: (id: number | string) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/complete`),
      "Failed to complete queue ticket."
    ),

  skip: (id: number | string) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${id}/skip`),
      "Failed to skip queue ticket."
    ),
};

export default QueueService;
