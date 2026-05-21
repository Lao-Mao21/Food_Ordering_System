import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const AnalyticsService = {
  getSales: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get("analytics/sales", { params }),
      "Failed to fetch sales analytics."
    ),

  generateSummary: (data: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.post("analytics/summary/generate", data),
      "Failed to generate analytics summary."
    ),
};

export default AnalyticsService;
