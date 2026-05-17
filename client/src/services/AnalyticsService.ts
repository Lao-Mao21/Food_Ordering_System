import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const AnalyticsService = {
  getSales: (params?: Record<string, unknown>) =>
    handleRequest(
      AxiosInstance.get("analytics/sales", { params }),
      "Failed to fetch sales analytics."
    ),
};

export default AnalyticsService;
