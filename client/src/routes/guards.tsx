import React, { Suspense } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PATHS } from "./path";
import { LoadingSpinner, Button } from "../components/ui";
import type { Role } from "../interfaces/user";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <LoadingSpinner size="xlg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return (
    <Suspense>
      <Outlet />
    </Suspense>
  );
};

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <LoadingSpinner size="xlg" text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? PATHS.APP.DASHBOARD : PATHS.APP.ORDERS} replace />;
  }

  return (
    <Suspense>
      <Outlet />
    </Suspense>
  );
};

export const AppEntryRoute: React.FC = () => {
  const { user } = useAuth();

  return <Navigate to={user?.role === "admin" ? PATHS.APP.DASHBOARD : PATHS.APP.ORDERS} replace />;
};

interface RoleRouteProps {
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-8xl font-black text-primary/30">403</div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-text">
            Access Denied
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            You do not have the required permissions to view this page.
            Contact your administrator if you believe this is a mistake.
          </p>
          <Button
            variant="primary"
            iconName="FaArrowLeft"
            onClick={handleSignOut}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <Outlet />
    </Suspense>
  );
};

