import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const AuthService = {

    csrf: () =>
        AxiosInstance.get("/sanctum/csrf-cookie", {
            baseURL: import.meta.env.VITE_API_URL,
        }),

    login: (credentials: { email: string; password: string }) =>
        handleRequest(
            AxiosInstance.post("auth/login", credentials),
            "Login failed.",
            { returnFullResponse: true }
        ),

    register: (data: { name: string; email: string; password: string; password_confirmation: string; device_name?: string }) =>
        handleRequest(
            AxiosInstance.post("auth/register", data),
            "Registration failed.",
            { returnFullResponse: true }
        ),

    generatePassword: () =>
        handleRequest(
            AxiosInstance.post("auth/password/generate"),
            "Unable to generate a password."
        ),

    sendResetLink: (data: { email: string }) =>
        handleRequest(
            AxiosInstance.post("auth/password/forgot", data),
            "Unable to send reset link.",
            { returnFullResponse: true }
        ),

    resetPassword: (data: { email: string; token: string; password: string; password_confirmation: string }) =>
        handleRequest(
            AxiosInstance.post("auth/password/reset", data),
            "Unable to reset password.",
            { returnFullResponse: true }
        ),

    me: () =>
        handleRequest(
            AxiosInstance.get("user/auth/me"),
            "Failed to fetch current user.",
            { silentStatuses: [401, 419] }
        ),

    logout: () =>
        handleRequest(
            AxiosInstance.post("auth/logout"),
            "Logout failed."
        ),
};

export default AuthService;


