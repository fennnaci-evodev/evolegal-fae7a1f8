import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function BackButton({ to, label = "Back", className = "", showLabel = false }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Hide on root routes
  if (location.pathname === "/" || location.pathname === "/dashboard") return null;

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 h-9 min-w-9 px-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-[0.97] transition-all ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}
