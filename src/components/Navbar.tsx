import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  LogIn,
  Mail,
  Menu,
  Newspaper,
  Workflow,
  X,
} from "lucide-react";
import { EvoLogo } from "./EvoLogo";
import { useAuth } from "@/hooks/useAuth";
import { AdminModeToggle } from "./AdminModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { BackButton } from "./BackButton";

const links = [
  { label: "How It Works", to: "/how-it-works", icon: Workflow },
  { label: "Services", to: "/services", icon: BriefcaseBusiness },
  { label: "Pricing", to: "/pricing", icon: BadgeDollarSign },
  { label: "Blog", to: "/blog", icon: Newspaper },
  { label: "FAQ", to: "/faq", icon: CircleHelp },
  { label: "Contact", to: "/contact", icon: Mail },
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
          <div className="flex items-center gap-1.5 relative z-10">
            <div className="lg:hidden"><BackButton /></div>
            <Link to="/" className="flex items-center gap-2">
              <EvoLogo size="sm" animate={false} showText />
            </Link>
          </div>

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
                    Run Legal Audit
                  </Button>
                </Link>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>


      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <Button asChild variant="ghost" className="absolute inset-x-0 bottom-0 top-[65px] h-auto w-auto rounded-none bg-background/60 p-0 backdrop-blur-[2px] hover:bg-background/60">
              <motion.button
                type="button"
                aria-label="Close navigation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setMobileOpen(false)}
              />
            </Button>
            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-label="Main navigation"
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mobile-nav-panel absolute left-3 right-3 top-[76px] overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 p-3">
                {links.map((l) => {
                  const active = location.pathname === l.to;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      data-active={active}
                      onClick={() => setMobileOpen(false)}
                      className="mobile-nav-item group"
                    >
                      <span className="mobile-nav-icon">
                        <l.icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">{l.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-data-[active=true]:text-primary" />
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-border/60 p-3">
                {!loading && user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button className="cyber-button cyber-cta h-11 w-full justify-between px-4" size="sm">
                      Dashboard
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="mobile-nav-signin h-11 w-full justify-between px-4" size="sm">
                      <span className="flex items-center gap-2.5"><LogIn className="h-4 w-4" />Sign In</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
