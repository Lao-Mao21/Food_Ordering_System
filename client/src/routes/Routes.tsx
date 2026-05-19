/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "./path";
import { ProtectedRoute, GuestRoute, RoleRoute } from "./guards";
import RootLayout from "./RootLayout";

// Lazy Loading
const Login = React.lazy(() => import("../pages/auth/Login"));
const Register = React.lazy(() => import("../pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("../pages/auth/ResetPassword"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const Orders = React.lazy(() => import("../pages/Orders"));
const MenuManagement = React.lazy(() => import("../pages/MenuManagement"));
const Categories = React.lazy(() => import("../pages/Categories"));
const RecycleBin = React.lazy(() => import("../pages/RecycleBin"));
const SalesAnalytics = React.lazy(() => import("../pages/SalesAnalytics"));

export const Routes = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            path: PATHS.HOME,
            element: <Navigate to={PATHS.LOGIN} replace />,
          },
          {
            path: PATHS.LOGIN,
            element: <Login />,
          },
          {
            path: PATHS.REGISTER,
            element: <Register />,
          },
          {
            path: PATHS.FORGOT_PASSWORD,
            element: <ForgotPassword />,
          },
          {
            path: PATHS.RESET_PASSWORD,
            element: <ResetPassword />,
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: PATHS.APP.ROOT,
            children: [
              {
                index: true,
                element: <Navigate to={PATHS.APP.DASHBOARD} replace />,
              },
              {
                element: <RoleRoute allowedRoles={['admin']} />,
                children: [
                  {
                    path: PATHS.APP.DASHBOARD,
                    element: <Dashboard />,
                  },
                  {
                    path: PATHS.APP.ORDERS,
                    element: <Orders />,
                  },
                  {
                    path: PATHS.APP.MENU,
                    element: <MenuManagement />,
                  },
                  {
                    path: PATHS.APP.CATEGORIES,
                    element: <Categories />,
                  },
                  {
                    path: PATHS.APP.RECYCLE_BIN,
                    element: <RecycleBin />,
                  },
                  {
                    path: PATHS.APP.ANALYTICS,
                    element: <SalesAnalytics />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
