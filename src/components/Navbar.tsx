import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { EvoLogo } from "./EvoLogo";
import { useAuth } from "@/hooks/useAuth";
import { AdminModeToggle } from "./AdminModeToggle";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { label: "How It Works", to: "/how-it-works" },
  { label: "Services", to: "/services" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/40"
        style={{
          background: "hsl(var(--background) / 0.72)",
          backdropFilter: "blur(14px) saturate(1.4)",
          WebkitBackdropFilter: "blur(14px) saturate(1.4)",
        }}
      >
        <div className="container mx-auto flex items-center justify-between py-2 px-6">
          <Link to="/" className="flex items-center gap-2 relative z-10">
            <EvoLogo size="sm" animate={false} showText />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-7">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  data-active={active}
                  className={`cyber-navlink text-xs font-medium uppercase tracking-widest ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!loading && user && <AdminModeToggle />}
            {loading ? (
              <div className="w-[100px]" />
            ) : user ? (
              <Link to="/dashboard">
                <Button size="sm" className="cyber-button cyber-cta px-5">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button size="sm" className="cyber-button cyber-ghost px-4">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="cyber-button cyber-cta px-5">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>


      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 glass-strong p-6 lg:hidden"
            style={{ borderRadius: "0 0 1.25rem 1.25rem" }}
          >
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                    location.pathname === l.to
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {!loading && user ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="hero" className="w-full" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
