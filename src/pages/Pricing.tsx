import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Zap, Crown, Infinity as InfinityIcon } from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { CREDIT_PACKS, PRODUCT_PLANS } from "@/lib/pricing";

const planIcons = {
  free: Sparkles,
  basic: Zap,
  pro: Crown,
  premium: InfinityIcon,
};

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
               General Hugo access remains unlimited. Credits apply only to advanced legal analysis workflows.
            </p>
          </motion.div>

          {/* Plans grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            {PRODUCT_PLANS.map((plan) => {
              const Icon = planIcons[plan.id];
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-6 flex flex-col ${plan.highlighted ? "glass-card glow-cyan" : "glass-card"}`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold z-10 whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-display font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
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
                    <Button variant={plan.highlighted ? "hero" : "outline"} size="sm" className="w-full">
                      {plan.cta} {plan.highlighted && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
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
                 Add analysis capacity at any time. Purchased credits do not expire.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.credits}
                  className={`relative rounded-xl p-5 text-center glass-card ${pack.bestValue ? "glow-cyan" : ""}`}
                >
                  {pack.bestValue && (
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
