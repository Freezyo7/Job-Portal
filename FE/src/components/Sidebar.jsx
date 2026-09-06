import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import leafPng from "../assets/leaf.png";
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
    label: "MAIN MENU",
    items: [
      { name: "Dashboard", icon: <RiHomeSmile2Line size={17} />, path: "/" },
      {
        name: "My Applications",
        icon: <FaRegFileLines size={16} />,
        path: "/applications",
      },
      { name: "Interviews", icon: <MdOutlineChat size={17} />, path: "/interviews" },
      { name: "Profile", icon: <CgProfile size={17} />, path: "/profile" },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { name: "Find Jobs", icon: <MdOutlineSearch size={18} />, path: "/find-jobs" },
      { name: "Companies", icon: <MdOutlineApartment size={18} />, path: "/companies" },
    ],
  },
  {
    label: "RESOURCES",
    items: [
      { name: "Career Tips", icon: <MdOutlineArticle size={17} />, path: "/career-tips" },
    ],
  },
  {
    label: "SETTINGS",
    items: [{ name: "Settings", icon: <LuSettings size={17} />, path: "/settings" }],
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
        className="fixed top-3 left-3 z-50 p-2 rounded-xl border shadow-sm lg:hidden"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
          color: "var(--nt-text-primary)",
        }}
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

      {/* Sidebar container - always fixed and full-height h-screen */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 transform flex-col border-r transition-transform duration-150 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          backgroundColor: "var(--nt-bg-sidebar)",
          borderColor: "var(--nt-border)",
        }}
      >
        {/* Header */}
        <div
          className="h-16 px-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--nt-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
              style={{
                backgroundColor: "var(--nt-accent-sage)",
                color: "#FFFFFF",
              }}
            >
              C
            </div>
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: "var(--nt-text-primary)" }}
            >
              Career Hub
            </span>
          </div>
          <ThemeToggle variant="button" className="h-8 w-8 text-xs rounded-xl" />
        </div>

        {/* Navigation list */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3.5 py-4 z-10">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {/* Section Label */}
              <h3
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 mb-1.5 font-mono"
                style={{ color: "var(--nt-text-muted)" }}
              >
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
                      `relative flex items-center px-3 py-2 rounded-xl text-xs transition-all font-medium`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            backgroundColor: "rgba(78, 124, 97, 0.12)",
                            color: "var(--nt-accent-sage)",
                            fontWeight: "600",
                          }
                        : {
                            color: "var(--nt-text-secondary)",
                          }
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="mr-3 text-base flex-shrink-0"
                          style={{
                            color: isActive ? "var(--nt-accent-sage)" : "var(--nt-text-secondary)",
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Real botanical leaf PNG illustration — pinned to bottom corner */}
        <div className="pointer-events-none absolute bottom-16 left-0 w-full overflow-hidden z-0 flex items-end justify-start">
          <img
            src={leafPng}
            alt=""
            aria-hidden="true"
            className="sidebar-leaf-art w-56 -ml-1 -mb-1 select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Signed-in user + logout (pinned at bottom) */}
        <div
          className="border-t p-3.5 space-y-2 z-10 flex-shrink-0"
          style={{
            borderColor: "var(--nt-border)",
            backgroundColor: "var(--nt-bg-sidebar)",
          }}
        >
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border shadow-xs"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            >
              {((user?.username?.[0] ?? "N")).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-bold"
                style={{ color: "var(--nt-text-primary)" }}
              >
                {user?.username || "Nishant"}
              </p>
              <p
                className="truncate text-[10px]"
                style={{ color: "var(--nt-text-muted)" }}
              >
                {user?.email || "nishantsingh27022004@gmail.com"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              color: "var(--nt-text-secondary)",
            }}
          >
            <MdLogout className="mr-2 text-base" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
