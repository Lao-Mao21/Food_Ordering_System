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
const QueueBoard = React.lazy(() => import("../pages/QueueBoard"));
const Services = React.lazy(() => import("../pages/Services"));

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
                path: PATHS.APP.DASHBOARD,
                element: <Dashboard />,
              },
              {
                path: PATHS.APP.QUEUE,
                element: <QueueBoard />,
              },
              {
                element: <RoleRoute allowedRoles={['admin']} />,
                children: [
                  {
                    path: PATHS.APP.SERVICES,
                    element: <Services />,
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