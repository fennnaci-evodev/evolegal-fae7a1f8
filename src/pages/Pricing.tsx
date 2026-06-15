import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Zap, Crown, Infinity as InfinityIcon } from "lucide-react";
import { fadeUp } from "@/lib/animations";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started with Hugo",
    icon: Sparkles,
    features: [
      "Unlimited general chat with Hugo",
      "2 precise analyses / day",
      "Basic articles & guides",
      "Generic document templates",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$19",
    period: "/mo",
    desc: "For everyday legal questions",
    icon: Zap,
    features: [
      "Unlimited general chat",
      "15 precise analyses / day",
      "More documents per month",
      "Full article & video library",
    ],
    cta: "Choose Basic",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    desc: "Power users & frequent matters",
    icon: Crown,
    features: [
      "Unlimited general chat",
      "60 precise analyses / day",
      "Unlimited documents",
      "Priority Expert connection",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "/mo",
    desc: "Highest tier, no limits",
    icon: InfinityIcon,
    features: [
      "Unlimited general chat",
      "Unlimited precise analyses",
      "Dedicated Expert support",
      "Fastest response times",
    ],
    cta: "Go Premium",
    highlight: false,
  },
];

const creditPacks = [
  { credits: 20, price: "$9" },
  { credits: 50, price: "$19" },
  { credits: 100, price: "$35", best: true },
  { credits: 250, price: "$79" },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-12" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Hugo's general chat is always free and unlimited. Credits apply only to deeper Legal Analysis of Your Life Circumstances.
            </p>
          </motion.div>

          {/* Plans grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-6 flex flex-col ${plan.highlight ? "glass-card glow-cyan" : "glass-card"}`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold z-10 whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-display font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-display font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button variant={plan.highlight ? "hero" : "outline"} size="sm" className="w-full">
                      {plan.cta} {plan.highlight && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </motion.div>

          {/* Credit packs */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                One-time <span className="text-gradient">Credit Packs</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Top up precise-analysis credits anytime. Credits never expire.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {creditPacks.map((pack) => (
                <div
                  key={pack.credits}
                  className={`relative rounded-xl p-5 text-center glass-card ${pack.best ? "glow-cyan" : ""}`}
                >
                  {pack.best && (
                    <span className="absolute -top-2 inset-x-0 mx-auto w-fit px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold whitespace-nowrap">
                      Best value
                    </span>
                  )}
                  <p className="text-2xl font-display font-bold text-foreground">{pack.credits}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">credits</p>
                  <p className="text-lg font-display font-semibold text-primary mb-3">{pack.price}</p>
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="w-full text-xs">Buy</Button>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.p
            className="text-center text-xs text-muted-foreground/60 mt-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            Prices in USD. Subscriptions auto-renew monthly. Cancel anytime. General informational resources only — not legal advice.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
