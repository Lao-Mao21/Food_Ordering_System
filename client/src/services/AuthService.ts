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
     * Register a new user account.
     */
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
        handleRequest(
            AxiosInstance.post("auth/register", data),
            "Registration failed.",
            { returnFullResponse: true }
        ),

    /**
     * Send a password reset email to the user.
     */
    sendResetLink: (data: { email: string }) =>
        handleRequest(
            AxiosInstance.post("auth/password/forgot", data),
            "Unable to send reset link.",
            { returnFullResponse: true }
        ),

    /**
     * Reset the user's password using a token.
     */
    resetPassword: (data: { email: string; token: string; password: string; password_confirmation: string }) =>
        handleRequest(
            AxiosInstance.post("auth/password/reset", data),
            "Unable to reset password.",
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
