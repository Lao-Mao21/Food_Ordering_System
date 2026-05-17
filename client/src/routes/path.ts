const APP_ROOT = "/app";

export const PATHS = {
  // Public Routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",

  // Authenticated
  APP: {
    ROOT: `${APP_ROOT}`,
    DASHBOARD: `${APP_ROOT}/dashboard`,
    QUEUE: `${APP_ROOT}/queue`,
    SERVICES: `${APP_ROOT}/services`,
    USERS: `${APP_ROOT}/users`,
    USER_DETAIL: `${APP_ROOT}/users/:slug`,
  },
};