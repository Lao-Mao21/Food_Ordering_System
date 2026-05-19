import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = 'users';

const UserService = {
    getAll: (params?: {
        search?: string;
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        filter?: 'active' | 'deleted' | 'all';
    }) =>
        handleRequest(
            AxiosInstance.get(`${BASE_PREFIX}`, { params }),
            "Failed to fetch users"
        ),

    getOne: (slug: string) =>
        handleRequest(
            AxiosInstance.get(`${BASE_PREFIX}/${slug}`),
            "Failed to fetch user details"
        ),

    create: (data: FormData) =>
        handleRequest(
            AxiosInstance.post(`${BASE_PREFIX}`, data),
            "Failed to create user"
        ),

    update: (id: string | number, data: FormData,) =>
        handleRequest(
            AxiosInstance.post(`${BASE_PREFIX}/${id}`, data),
            "Failed to update user"
        ),

    delete: (id: string | number) =>
        handleRequest(
            AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
            "Failed to delete user"
        ),

    restore: (id: string | number) =>
        handleRequest(
            AxiosInstance.post(`${BASE_PREFIX}/${id}/restore`),
            "Failed to restore user"
        ),

    forceDelete: (id: string | number) =>
        handleRequest(
            AxiosInstance.delete(`${BASE_PREFIX}/${id}/force`),
            "Failed to permanently delete user"
        ),
};

export default UserService;
