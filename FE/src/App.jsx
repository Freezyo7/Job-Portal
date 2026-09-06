import Sidebar from "./components/Sidebar";
import Router from "./Router";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { useAuth } from "./lib/useAuth";
import { ThemeProvider } from "./lib/ThemeContext";

// Pages that never show the Sidebar (public / full-screen pages)
const NO_SIDEBAR_PAGES = ["/login", "/signup", "/verify", "/landing"];

function AppShell() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  // Don't show sidebar on explicit no-sidebar pages,
  // on the root "/" when the user is NOT logged in (landing page),
  // or while the auth state is still resolving.
  const isLandingRoot = pathname === "/" && !user && !loading;
  const isNoSidebarPage = NO_SIDEBAR_PAGES.includes(pathname);
  const showSidebar = !isNoSidebarPage && !isLandingRoot && !!user;

  return (
    <div
      className="min-h-screen flex transition-colors duration-150"
      style={{
        backgroundColor: "var(--nt-bg-primary)",
        color: "var(--nt-text-primary)",
      }}
    >
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "lg:ml-64 flex-1 min-w-0 flex flex-col" : "flex-1 min-w-0 flex flex-col"}>
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
