import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Explore the basics",
    features: ["Unlimited articles", "3 videos/month", "1 short chat session/month", "Community resources"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$24",
    period: "/mo",
    desc: "Essential access",
    features: ["Unlimited videos & articles", "3 request submissions/month", "Basic Client Portal", "Email support", "Generic templates"],
    cta: "Choose Basic",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$59",
    period: "/mo",
    desc: "Full power",
    features: ["Everything in Basic", "Unlimited submissions", "Priority 24h turnaround", "Deep-dive exclusive content", "Full Case File portal", "Human Expert consultations"],
    cta: "Go Pro",
    highlight: false,
    annual: "$499/year — save 20%",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              No hidden fees. Cancel anytime. Upgrade or downgrade freely.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`glass-card p-7 flex flex-col relative ${plan.highlight ? "gradient-border glow-cyan" : ""}`}
                initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold z-10">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-display font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-1">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                {plan.annual ? <p className="text-xs text-primary mb-4">{plan.annual}</p> : <div className="mb-4" />}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full" variant={plan.highlight ? "hero" : "outline"} size="lg">
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center text-xs text-muted-foreground/50 mt-8"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            All plans provide general informational resources only. Prices in USD.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
