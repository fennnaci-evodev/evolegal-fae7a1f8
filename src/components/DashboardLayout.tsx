import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, FileText, BookOpen, Settings, LogOut, ShieldCheck, LayoutDashboard, Route as RouteIcon, PanelLeftClose, PanelLeftOpen, ScanText, Database, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { EvoLogo } from "./EvoLogo";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AdminModeToggle } from "./AdminModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BackButton } from "./BackButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QuickPreferences, QuickPreferencesButton } from "./QuickPreferences";

const SIDEBAR_KEY = "evo_sidebar_collapsed";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Videos & Lectures", url: "/dashboard/library", icon: PlayCircle },
  { title: "Launch Hugo Co-Pilot", url: "/dashboard/chat", icon: MessageCircle },
  { title: "Submit for Review", url: "/dashboard/submit", icon: FileText },
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
        { title: "Contract Analysis", url: "/dashboard/admin/contracts", icon: ScanText },
        { title: "Request Register", url: "/dashboard/admin/requests", icon: ShieldCheck },
        { title: "Source Verification", url: "/dashboard/admin/sources", icon: BookOpen },
        { title: "Dataset Curation", url: "/dashboard/admin/curation", icon: Database },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
      ]
    : navItems;

  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  const hideBottomNav = location.pathname === "/dashboard/chat" || location.pathname.startsWith("/dashboard/hugo/") || location.pathname.startsWith("/dashboard/chat/");
  const adminView = isAdmin && mode === "admin";
  const bottomItems = adminView
    ? [
        { title: "Workdesk", url: "/dashboard/admin/workdesk", icon: LayoutDashboard },
        { title: "Contracts", url: "/dashboard/admin/contracts", icon: ScanText },
        { title: "Requests", url: "/dashboard/admin/requests", icon: ShieldCheck },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "More", url: "#more", icon: Menu },
      ]
    : [
        { title: "Home", url: "/dashboard", icon: Home },
        { title: "Hugo", url: "/dashboard/chat", icon: MessageCircle },
        { title: "Review", url: "/dashboard/submit", icon: FileText },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "More", url: "#more", icon: Menu },
      ];
  const currentTitle = [...allNavItems, ...bottomItems].find((i) => i.url === location.pathname)?.title ?? "Dashboard";



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
              <div className="flex items-center"><ThemeToggle />{!collapsed && <QuickPreferencesButton />}</div>
            </div>
            {!collapsed && (
              <p className="px-3 py-2 text-[10px] text-muted-foreground/40 leading-relaxed">
                Structured analysis with expert review pathways.
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

        {/* Mobile header: back, logo, current view, quick preferences */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/30 px-2 h-14 flex items-center gap-1" style={{ borderRadius: 0 }}>
          <BackButton />
          <Link to="/" aria-label="EvoLegal home" className="flex h-11 w-11 items-center justify-center">
            <EvoLogo size="sm" animate={false} showText={false} />
          </Link>
          <span className="flex-1 truncate text-sm font-medium text-foreground/90">{currentTitle}</span>
          <QuickPreferencesButton />
        </div>

        <main className={`flex-1 md:p-8 p-4 pt-[4.5rem] md:pt-8 overflow-auto ${hideBottomNav ? "" : "pb-24 md:pb-8"}`}>
          {children}
        </main>

        {/* Mobile bottom navigation — hidden in Hugo chat so the conversation and keyboard get full height */}
        {!hideBottomNav && (
          <nav
            aria-label="Primary"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/30 pb-[env(safe-area-inset-bottom)]"
            style={{ borderRadius: 0 }}
          >
            <div className="grid grid-cols-5">
              {bottomItems.map((item) => {
                const active = item.url === "#more" ? moreOpen : location.pathname === item.url;
                const cls = `flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`;
                const inner = (<><item.icon className="h-5 w-5" /><span className="truncate max-w-full px-1">{item.title}</span></>);
                return item.url === "#more" ? (
                  <button key="more" type="button" onClick={() => setMoreOpen(true)} className={cls} aria-label="More navigation">{inner}</button>
                ) : (
                  <Link key={item.url} to={item.url} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
                );
              })}
            </div>
          </nav>
        )}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="md:hidden border-border/40 bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
            <SheetHeader className="text-left"><SheetTitle className="text-base">Navigate</SheetTitle></SheetHeader>
            {isAdmin && <div className="mt-3"><AdminModeToggle /></div>}
            <div className="mt-2 space-y-0.5">
              {allNavItems.map((item) => (
                <Link key={item.url} to={item.url} onClick={() => setMoreOpen(false)}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm ${location.pathname === item.url ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
                  <item.icon className="h-4 w-4" />{item.title}
                </Link>
              ))}
              <button type="button" onClick={async () => { setMoreOpen(false); await signOut(); navigate("/"); }}
                className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <QuickPreferences />
      </div>
    </TooltipProvider>
  );
}
