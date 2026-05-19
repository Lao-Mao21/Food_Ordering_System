import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const RecycleBinService = {
  getAll: () =>
    handleRequest(
      AxiosInstance.get("recycle-bin"),
      "Failed to fetch recycle bin."
    ),
};

export default RecycleBinService;
