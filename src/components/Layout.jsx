import { Outlet, Link, useLocation } from "react-router-dom";
import { Map, List, User, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Layout() {
  const location = useLocation();
  const { profile } = useAuth();

  const isAdmin = profile?.role === "admin";

  const navItems = [
    { path: "/", icon: Map, label: "Map" },
    { path: "/nearby", icon: List, label: "Nearby" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <Outlet />
      </div>

      <nav className="flex-shrink-0 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
