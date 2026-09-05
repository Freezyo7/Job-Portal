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
        className="fixed top-3 left-3 z-50 p-2 rounded-md border shadow-sm lg:hidden"
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

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r transition-transform duration-150 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          backgroundColor: "var(--nt-bg-sidebar)",
          borderColor: "var(--nt-border)",
        }}
      >
        <div
          className="h-14 px-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--nt-border)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: "var(--nt-accent-sage)",
                color: "#FFFFFF",
              }}
            >
              C
            </div>
            <span
              className="font-semibold text-sm tracking-tight"
              style={{ color: "var(--nt-text-primary)" }}
            >
              Career Hub
            </span>
          </div>
          <ThemeToggle variant="button" className="h-7 w-7 text-xs" />
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {/* Section Label */}
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1.5"
                style={{ color: "var(--nt-text-muted)" }}
              >
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
                      `flex items-center px-2.5 py-1.5 rounded-md text-xs transition-colors font-medium`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            backgroundColor: "var(--nt-bg-card-alt)",
                            color: "var(--nt-accent-sage)",
                            fontWeight: "600",
                            borderLeft: "2px solid var(--nt-accent-sage)",
                          }
                        : {
                            color: "var(--nt-text-secondary)",
                          }
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
          <div
            className="border-t p-3 space-y-2"
            style={{ borderColor: "var(--nt-border)" }}
          >
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold border"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                {(user.username?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-semibold"
                  style={{ color: "var(--nt-text-primary)" }}
                >
                  {user.username}
                </p>
                <p
                  className="truncate text-[10px]"
                  style={{ color: "var(--nt-text-muted)" }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                color: "var(--nt-text-secondary)",
              }}
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
