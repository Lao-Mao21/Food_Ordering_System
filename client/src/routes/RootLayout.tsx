import { Outlet } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

const RootLayout = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
