const APP_ROOT = "/app";

export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",

  APP: {
    ROOT: `${APP_ROOT}`,
    DASHBOARD: `${APP_ROOT}/dashboard`,
    ORDERS: `${APP_ROOT}/orders`,
    MENU: `${APP_ROOT}/menu`,
    CATEGORIES: `${APP_ROOT}/categories`,
    RECYCLE_BIN: `${APP_ROOT}/recycle-bin`,
    ANALYTICS: `${APP_ROOT}/analytics`,
    USERS: `${APP_ROOT}/users`,
    USER_DETAIL: `${APP_ROOT}/users/:slug`,
  },
};
