import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PATHS } from "../../routes/path";
import { Icon } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { notify } from "../../util/notify";
import Logo from "../../assets/react.svg";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const themeConfig = {
    light:  { icon: "FaSun"    as const, label: "Light Mode" },
    dark:   { icon: "FaMoon"   as const, label: "Dark Mode" },
    system: { icon: "FaDesktop" as const, label: "System" },
  };
  
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`
    : null;

  const handleLogout = async () => {
    try {
      await logout();
      notify.success("Logged out successfully.");
      navigate(PATHS.LOGIN, { replace: true });
    } catch {
      notify.error("Failed to log out. Please try again.");
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-bg-light border-b border-border-muted">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">

          {/* Left — Logo & Mobile Toggle */}
          <div className="flex items-center justify-start">
            <span
              onClick={onMenuClick}
              className="p-2 mr-2 text-text-muted rounded-lg sm:hidden focus:outline-none cursor-pointer">
              <Icon iconName="FaAlignJustify" />
            </span>
            <Link to={PATHS.APP.DASHBOARD} className="flex gap-3 items-center">
              <img src={Logo} alt="App Logo" />
              <span className="text-text font-black text-lg tracking-tighter uppercase italic hidden sm:block">BUENAVIDES ReactLaravel</span>
            </Link>
          </div>

          {/* Right — User Profile Dropdown */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1.5 rounded-2xl cursor-pointer
                  hover:bg-bg-main transition-colors duration-200 focus:outline-none"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-border-muted
                  flex items-center justify-center bg-primary/10 shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black uppercase text-primary">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-text leading-tight truncate max-w-35">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                    {user.role}
                  </span>
                </div>

                <Icon
                  iconName="FaChevronDown"
                  size={10}
                  className={`text-text-muted hidden md:block transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-bg-light border border-border-muted
                  rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">

                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-border-muted bg-bg-main/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-border-muted
                        flex items-center justify-center bg-primary/10 shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black uppercase text-primary">
                            {user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-text truncate">
                          {user.name}
                        </span>
                        <span className="text-xs text-text-muted truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">

                    {/* Theme Toggle */}
                    <button
                      id="theme-toggle-btn"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-4 py-2.5
                        hover:bg-primary/10 transition-colors duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          iconName={themeConfig[theme].icon}
                          size={14}
                          className="text-text-muted group-hover:text-primary transition-colors duration-200"
                        />
                        <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors duration-200">
                          {themeConfig[theme].label}
                        </span>
                      </div>

                      {/* Segmented selector */}
                      <div className="flex items-center bg-bg-main rounded-lg p-0.5 gap-0.5">
                        {(["light", "dark", "system"] as const).map((mode) => (
                          <div
                            key={mode}
                            className={`p-1 rounded-md transition-all duration-200 ${
                              theme === mode
                                ? "bg-primary text-bg-dark shadow-sm"
                                : "text-text-muted"
                            }`}
                          >
                            <Icon iconName={themeConfig[mode].icon} size={10} />
                          </div>
                        ))}
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="mx-3 my-1 border-t border-border-muted" />

                    {/* Sign Out */}
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                        hover:bg-danger/10 transition-colors duration-200 cursor-pointer group"
                    >
                      <Icon
                        iconName="FaRightFromBracket"
                        size={14}
                        className="text-text-muted group-hover:text-danger transition-colors duration-200"
                      />
                      <span className="text-sm font-semibold text-text group-hover:text-danger transition-colors duration-200">
                        Sign Out
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </nav>
  );

};

export default Navbar;