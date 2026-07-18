import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, FileText, BookOpen, Settings, LogOut, ShieldCheck, LayoutDashboard, Route as RouteIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";
import { EvoLogo } from "./EvoLogo";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AdminModeToggle } from "./AdminModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SIDEBAR_KEY = "evo_sidebar_collapsed";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Videos & Lectures", url: "/dashboard/library", icon: PlayCircle },
  { title: "Ask Hugo", url: "/dashboard/chat", icon: MessageCircle },
  { title: "Submit Request", url: "/dashboard/submit", icon: FileText },
  { title: "Workflow Guides", url: "/dashboard/workflows", icon: RouteIcon },
  { title: "My Library", url: "/dashboard/saved", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { mode, isAdmin, isMainAdmin } = useAdminMode();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  const allNavItems = isAdmin && mode === "admin"
    ? [
        { title: "Expert Dashboard", url: "/dashboard/admin/workdesk", icon: LayoutDashboard },
        { title: "Request Register", url: "/dashboard/admin/requests", icon: ShieldCheck },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ]
    : navItems;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col glass-strong border-r border-border/30 p-4 shrink-0"
          style={{
            borderRadius: 0,
            width: collapsed ? 72 : 256,
            transition: "width 0.25s ease",
          }}
        >
          {/* Header row */}
          <div className={`flex items-center px-1 py-4 mb-6 ${collapsed ? "justify-center" : "justify-between px-3"}`}>
            {!collapsed && (
              <Link to="/">
                <EvoLogo size="sm" animate={false} showText />
              </Link>
            )}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {!collapsed && <AdminModeToggle />}

          <nav className="flex-1 space-y-1 mt-2">
            {allNavItems.map((item) => {
              const isActive = location.pathname === item.url;
              const linkContent = (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } ${
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
                  <item.icon className="h-4 w-4 relative z-10 shrink-0" />
                  {!collapsed && <span className="relative z-10 truncate">{item.title}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.url}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.url}>{linkContent}</div>;
            })}
          </nav>

          <div className="border-t border-border/30 pt-4 mt-4">
            <div className={`flex ${collapsed ? "justify-center" : "justify-between items-center px-3"} mb-2`}>
              {!collapsed && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Theme</span>
              )}
              <ThemeToggle />
            </div>
            {!collapsed && (
              <p className="px-3 py-2 text-[10px] text-muted-foreground/40 leading-relaxed">
                Hugo & our Experts are here to help.
              </p>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="#"
                    onClick={async (e) => { e.preventDefault(); await signOut(); navigate("/"); }}
                    className="flex items-center justify-center px-2 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="#"
                onClick={async (e) => { e.preventDefault(); await signOut(); navigate("/"); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            )}
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
            <ThemeToggle className="ml-1" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:p-8 p-4 pt-16 md:pt-8 overflow-auto" style={{ transition: "margin 0.25s ease" }}>
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
