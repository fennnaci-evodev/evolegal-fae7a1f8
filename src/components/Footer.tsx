import { Link } from "react-router-dom";
import { EvoLogo } from "./EvoLogo";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "How It Works", to: "/how-it-works" },
      { label: "Services", to: "/services" },
      { label: "Pricing", to: "/pricing" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 pt-16 pb-8 px-6 relative z-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <EvoLogo size="sm" animate={false} showText />
            <p className="text-sm text-muted-foreground mt-4 max-w-sm leading-relaxed">
              Clear insights on English (UK) law & US legal concepts. General education, preparation resources, and informational support nationwide.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-display font-semibold text-sm mb-4 text-foreground">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="neon-line mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">© 2026 EvoLegal. All rights reserved.</p>
          <p className="text-xs text-muted-foreground/50 text-center max-w-xl">
            At EvoLegal, our Experts — led by Hugo — work hard on every request. We draw from a vast base of cases and legislation to deliver objective, relevant, and accurate insights. We deeply care about your legal security. For complex personal matters, professional representation may be recommended.
          </p>
        </div>
      </div>
    </footer>
  );
}
