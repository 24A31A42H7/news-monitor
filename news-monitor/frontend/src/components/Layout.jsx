import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  Search as SearchIcon,
  Bookmark,
  FileText,
  Tag as TagIcon,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { logout } from "../redux/slices/authSlice";
import api from "../api/client";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: SearchIcon },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/tags", label: "Tags", icon: TagIcon },
];

export default function Layout() {
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}

    dispatch(logout());
    navigate("/login");
  };

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed md:static
          top-0 left-0
          z-50
          h-full
          w-64
          bg-white
          border-r
          border-gray-200
          flex
          flex-col
          transform
          transition-transform
          duration-300
          ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Sidebar Header */}

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

          <div>
            <h1 className="text-lg font-bold text-brand-700">
              News Monitor
            </h1>

            <p className="text-xs text-gray-500">
              Industry Intelligence Platform
            </p>
          </div>

          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 px-3 py-4 space-y-1">

          {navItems.map(({ to, label, icon: Icon }) => (

            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} />

              {label}
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <ShieldCheck size={18} />
              Admin
            </NavLink>
          )}
        </nav>

        {/* User */}

        <div className="px-4 py-4 border-t border-gray-200">

          <div className="flex items-center gap-3 mb-4">

            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
                {user?.fullName?.charAt(0)}
              </div>
            )}

            <div className="min-w-0">

              <p className="text-sm font-semibold truncate">
                {user?.fullName}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>

            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Mobile Header */}

        <header className="md:hidden h-16 bg-white border-b flex items-center justify-between px-4">

          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={28} />
          </button>

          <h2 className="text-lg font-bold text-brand-700">
            News Monitor
          </h2>

          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt=""
              className="w-9 h-9 rounded-full"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center">
              {user?.fullName?.charAt(0)}
            </div>
          )}
        </header>

        {/* Content */}

        <main className="flex-1 overflow-y-auto">

          <div className="p-4 md:p-6 max-w-7xl mx-auto">

            <Outlet />

          </div>

        </main>
      </div>
    </div>
  );
}