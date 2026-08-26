import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import { useAuth } from "../lib/useAuth";
import { RiHomeSmile2Line } from "react-icons/ri";
import { FaRegFileLines } from "react-icons/fa6";
import { MdOutlineBookmarkAdded } from "react-icons/md";
import { LuSettings } from "react-icons/lu";
import { MdOutlineChat } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { MdOutlineSearch } from "react-icons/md";
import { MdOutlineApartment } from "react-icons/md";
import { MdOutlineArticle } from "react-icons/md";
import { SiLevelsdotfyi } from "react-icons/si";

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
    label: "Settings & Support",
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
        className="fixed top-4 left-4 z-50 p-2 text-gray-800 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r-2 border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-4 border-b-2 border-gray-200 font-bold text-xl">
          Career Hub
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              {/* Section Label */}
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {section.label}
              </h3>

              {/* Section Items */}
              <div className="flex flex-col space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    target="_self"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-gray-100 text-primary font-semibold"
                          : "text-gray-600 hover:bg-gray-50 font-medium"
                      }`
                    }
                    onClick={() => setIsOpen(false)} // Close sidebar on link click in mobile
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Signed-in user + logout */}
        {user && (
          <div className="border-t-2 border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]">
                {(user.username?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {user.username}
                </p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <MdLogout className="mr-3 text-lg" />
              Log out
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
