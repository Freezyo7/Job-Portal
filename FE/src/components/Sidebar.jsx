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
      {/* Mobile Menu Button */}
      <button
        className="fixed top-3 left-3 z-50 p-2 rounded-xl border shadow-sm lg:hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 transform flex-col transition-transform duration-150 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Brand header */}
        <div
          className="h-16 px-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, var(--green-dark), var(--green-medium))",
                color: "#FFFFFF",
              }}
            >
              C
            </div>
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Career Hub
            </span>
          </div>
          <ThemeToggle variant="button" className="h-8 w-8 text-xs rounded-xl" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3.5 py-4 z-10">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {/* Section label */}
              <h3
                className="px-2.5 mb-1.5"
                style={{
                  color: "#81796B",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {section.label}
              </h3>

              {/* Items */}
              <div className="flex flex-col space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className="relative flex items-center px-3 py-2 rounded-xl text-xs transition-all font-medium"
                    style={({ isActive }) =>
                      isActive
                        ? {
                          background: "linear-gradient(90deg, #DDE8DC 0%, #E8EADF 100%)",
                          color: "#315E4A",
                          fontWeight: "600",
                          borderLeft: "2.5px solid #2F7A5A",
                        }
                        : {
                          color: "var(--text-secondary)",
                          borderLeft: "2.5px solid transparent",
                        }
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="mr-3 flex-shrink-0"
                          style={{ color: isActive ? "#39735A" : "var(--text-muted)" }}
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

        {/* Botanical leaf illustration */}
        <div className="pointer-events-none absolute bottom-[109px] left-0 w-full h-[360px] overflow-hidden z-0 flex items-end justify-start">
          <img
            src={leafPng}
            alt=""
            aria-hidden="true"
            className="sidebar-leaf-art w-[150%] max-w-none -ml-4 -mb-2 select-none pointer-events-none object-contain origin-bottom-left"
            draggable={false}
            style={{ opacity: 0.28 }}
          />
        </div>

        {/* User section */}
        <div
          className="p-3.5 space-y-2 z-10 flex-shrink-0"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-sidebar)",
          }}
        >
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {((user?.username?.[0] ?? "N")).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                {user?.username || "Nishant"}
              </p>
              <p className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
                {user?.email || "nishantsingh27022004@gmail.com"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
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
