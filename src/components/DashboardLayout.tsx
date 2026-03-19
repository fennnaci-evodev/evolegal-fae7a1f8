import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, FileText, BookOpen, Settings, LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { EvoLogo } from "./EvoLogo";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Videos & Lectures", url: "/dashboard/library", icon: PlayCircle },
  { title: "Ask Hugo", url: "/dashboard/chat", icon: MessageCircle },
  { title: "Submit Request", url: "/dashboard/submit", icon: FileText },
  { title: "My Library", url: "/dashboard/saved", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  const allNavItems = isAdmin
    ? [
        ...navItems,
        { title: "Admin Requests", url: "/dashboard/admin/requests", icon: ShieldCheck },
        { title: "Expert Dashboard", url: "/dashboard/admin/workdesk", icon: LayoutDashboard },
      ]
    : navItems;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-strong border-r border-border/30 p-4" style={{ borderRadius: 0 }}>
        <Link to="/" className="px-3 py-4 mb-6">
          <EvoLogo size="sm" animate={false} showText />
        </Link>

        <nav className="flex-1 space-y-1">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/8 rounded-lg"
                    style={{ background: "hsla(186, 100%, 50%, 0.08)" }}
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/30 pt-4 mt-4">
          <p className="px-3 py-2 text-[10px] text-muted-foreground/40 leading-relaxed">
            Hugo & our Experts are here to help.
          </p>
          <Link
            to="#"
            onClick={async (e) => { e.preventDefault(); await signOut(); navigate("/"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/30 px-4 py-3 flex items-center justify-between" style={{ borderRadius: 0 }}>
        <Link to="/">
          <EvoLogo size="sm" animate={false} showText={false} />
        </Link>
        <div className="flex gap-1">
          {allNavItems.slice(0, 5).map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === item.url ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:p-8 p-4 pt-16 md:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
