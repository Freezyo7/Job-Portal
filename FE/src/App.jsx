import Sidebar from "./components/Sidebar";
import Router from "./Router";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";

const AUTH_PAGES = ["/login", "/signup", "/verify"];

function App() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen flex">
        {!isAuthPage && (
          <div>
            <Sidebar />
          </div>
        )}
        <div className={isAuthPage ? "flex-1" : "lg:ml-64 flex-1"}>
          <Router />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
