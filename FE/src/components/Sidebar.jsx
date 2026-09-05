import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import { useAuth } from "../lib/useAuth";
import { RiHomeSmile2Line } from "react-icons/ri";
import { FaRegFileLines } from "react-icons/fa6";
import { LuSettings } from "react-icons/lu";
import { MdOutlineChat } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { MdOutlineSearch } from "react-icons/md";
import { MdOutlineApartment } from "react-icons/md";
import { MdOutlineArticle } from "react-icons/md";
import ThemeToggle from "./ThemeToggle";

const navSections = [
  {
    label: "Main Menu",
    items: [
      { name: "Dashboard", icon: <RiHomeSmile2Line />, path: "/" },
      {
        name: "My Applications",
        icon: <FaRegFileLines />,
        path: "/applications",
      },
      { name: "Interviews", icon: <MdOutlineChat />, path: "/interviews" },
      { name: "Profile", icon: <CgProfile />, path: "/profile" },
    ],
  },
  {
    label: "Explore",
    items: [
      { name: "Find Jobs", icon: <MdOutlineSearch />, path: "/find-jobs" },
      { name: "Companies", icon: <MdOutlineApartment />, path: "/companies" },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Career Tips", icon: <MdOutlineArticle />, path: "/career-tips" },
    ],
  },
  {
    label: "Settings",
    items: [{ name: "Settings", icon: <LuSettings />, path: "/settings" }],
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Menu Button (Hamburger) */}
      <button
        className="fixed top-3 left-3 z-50 p-2 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-zinc-200 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#09090B] transition-transform duration-150 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
              Career Hub
            </span>
          </div>
          <ThemeToggle variant="button" className="h-7 w-7 text-xs" />
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {/* Section Label */}
              <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1.5">
                {section.label}
              </h3>

              {/* Section Items */}
              <div className="flex flex-col space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    target="_self"
                    className={({ isActive }) =>
                      `flex items-center px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? "bg-zinc-200/80 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-2.5 text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Signed-in user + logout */}
        {user && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                {(user.username?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {user.username}
                </p>
                <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400"
            >
              <MdLogout className="mr-2 text-base" />
              Log out
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

