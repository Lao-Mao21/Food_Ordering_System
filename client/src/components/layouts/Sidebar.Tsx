import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../ui";
import * as FaIcons from 'react-icons/fa6';
import { PATHS } from "../../routes/path";
import { useAuth } from "../../contexts/AuthContext";
import type { Role } from "../../interfaces/user";

// Define the shape of a single menu item
interface MenuItem {
  name: string;
  icon: keyof typeof FaIcons;
  path: string;
  roles?: Role[]; // If omitted, visible to all authenticated users
}

// Define the shape of a menu group
interface MenuGroup {
  group: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const menuGroups: MenuGroup[] = [
    {
      group: "Main",
      items: [
        {
          name: "Dashboard",
          icon: "FaHouse",
          path: PATHS.APP.DASHBOARD,
          roles: ['admin'],
        },
        {
          name: "Orders",
          icon: "FaReceipt",
          path: PATHS.APP.ORDERS,
          roles: ['admin'],
        },
        {
          name: "Menu",
          icon: "FaUtensils",
          path: PATHS.APP.MENU,
          roles: ['admin'],
        },
        {
          name: "Categories",
          icon: "FaTags",
          path: PATHS.APP.CATEGORIES,
          roles: ['admin'],
        },
        {
          name: "Recycle Bin",
          icon: "FaRecycle",
          path: PATHS.APP.RECYCLE_BIN,
          roles: ['admin'],
        },
        {
          name: "Analytics",
          icon: "FaChartSimple",
          path: PATHS.APP.ANALYTICS,
          roles: ['admin'],
        },
      ],
    },
  ];

  // Filter menu items by current user's role
  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-screen bg-bg-light pt-20 transition-transform border-r border-border-muted shadow
      ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:shadow-none`}>
      <div className="h-full px-4 pb-4 overflow-y-auto">
        {filteredGroups.map((group) => (
          <div key={group.group} className="mb-6">
            <h3 className="px-3 mb-2 text-sm font-black uppercase italic tracking-widest text-text-muted">
              {group.group}
            </h3>

            <ul className="space-y-1.5 font-medium">
              {group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center p-2.5 rounded-xl group relative ${
                        isActive
                          ? "bg-primary text-bg-dark shadow scale-[1.02] z-10 hover:bg-primary/80"
                          : "text-text hover:text-bg-dark hover:bg-primary"
                      }`}
                    >
                      {/*  Vertical bar */}
                      <span
                        className={`absolute left-1 h-6 w-1 rounded-r bg-bg-light transition-all duration-300 
                        ${
                          isActive
                            ? "group-hover:bg-secondary opacity-100 scale-y-100"
                            : "opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100"
                        }`}
                      />

                      {/* Icon */}
                      <div className="ml-2">
                        <Icon
                          iconName={item.icon}
                          className={`transition-colors ${
                            isActive
                              ? "text-bg-dark"
                              : "text-text group-hover:text-bg-dark"
                          }`}
                        />
                      </div>

                      {/* Text */}
                      <span
                        className={`ml-3 text-sm ${
                          isActive
                            ? "font-black italic uppercase tracking-tighter"
                            : "text-text group-hover:text-bg-dark"
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
  
};

export default Sidebar;
