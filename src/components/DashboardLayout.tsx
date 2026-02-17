import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, BookOpen, Settings, Scale, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Videos & Lectures", url: "/dashboard/library", icon: PlayCircle },
  { title: "Ask Expert Manager", url: "/dashboard/chat", icon: MessageCircle },
  { title: "My Library", url: "/dashboard/saved", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-strong border-r border-border/50 p-4">
        <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-6">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-gradient">EvoLegal</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 pt-4 mt-4">
          <div className="px-3 py-2 text-xs text-muted-foreground/60 leading-relaxed">
            General information only. Not legal advice.
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-bold text-gradient">EvoLegal</span>
        </Link>
        <div className="flex gap-2">
          {navItems.slice(0, 4).map((item) => (
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
