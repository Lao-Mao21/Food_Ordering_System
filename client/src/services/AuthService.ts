import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const AuthService = {

    /**
     * Fetch the CSRF cookie from Sanctum (required before login).
     */
    csrf: () =>
        AxiosInstance.get("/sanctum/csrf-cookie", {
            baseURL: import.meta.env.VITE_API_URL,
        }),

    /**
     * Login with email + password (session-based).
     */
    login: (credentials: { email: string; password: string }) =>
        handleRequest(
            AxiosInstance.post("auth/login", credentials),
            "Login failed.",
            { returnFullResponse: true }
        ),

    /**
     * Get the currently authenticated user.
     */
    me: () =>
        handleRequest(
            AxiosInstance.get("user/auth/me"),
            "Failed to fetch current user.",
            { silentStatuses: [401, 419] }
        ),

    /**
     * Logout the current user.
     */
    logout: () =>
        handleRequest(
            AxiosInstance.post("auth/logout"),
            "Logout failed."
        ),
};

export default AuthService;
