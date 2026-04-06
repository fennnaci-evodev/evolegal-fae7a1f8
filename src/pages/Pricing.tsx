import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Minus, ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/animations";

const features = [
  { label: "Articles & guides", free: "Unlimited", basic: "Unlimited", pro: "Unlimited" },
  { label: "Video lectures", free: "3 / month", basic: "Unlimited", pro: "Unlimited" },
  { label: "Chat sessions with Hugo", free: "1 short / month", basic: "Unlimited", pro: "Unlimited" },
  { label: "Request submissions", free: false, basic: "3 / month", pro: "Unlimited" },
  { label: "Turnaround time", free: false, basic: "~8 hours", pro: "~4 hours (priority)" },
  { label: "Client Portal", free: false, basic: "Basic", pro: "Full (Case File)" },
  { label: "File uploads & history", free: false, basic: true, pro: true },
  { label: "Generic templates", free: false, basic: true, pro: true },
  { label: "Deep-dive exclusive content", free: false, basic: false, pro: true },
  { label: "Expert consultations", free: false, basic: false, pro: true },
  { label: "Priority support", free: false, basic: false, pro: true },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm text-foreground/80">{value}</span>;
}

const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-6">
              No hidden fees. Cancel anytime. Upgrade or downgrade freely.
            </p>
            {/* Monthly / Annual toggle */}
            <div className="inline-flex items-center gap-3 glass rounded-full px-1.5 py-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual <span className="text-xs opacity-75">save 20%</span>
              </button>
            </div>
          </motion.div>

          <div className="overflow-x-auto overflow-y-visible -mx-6 px-6">
            <div className="min-w-[600px]">
          {/* Plan headers */}
          <motion.div
            className="grid grid-cols-4 gap-0 mb-0 overflow-visible relative z-10 pt-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <div /> {/* empty corner */}
            {[
              { name: "Free", price: "$0", period: "", desc: "Explore the basics", highlight: false },
              { name: "Basic", price: annual ? "$19" : "$24", period: "/mo", desc: "Essential access", highlight: false },
              { name: "Pro", price: annual ? "$41" : "$59", period: "/mo", desc: "Full power", highlight: true },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`text-center p-5 rounded-t-2xl relative ${plan.highlight ? "glass-card glow-cyan" : "glass-card"}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold z-10 whitespace-nowrap">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-display font-bold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{plan.desc}</p>
                <div>
                  <span className="text-3xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                {plan.name === "Pro" && annual && (
                  <p className="text-[10px] text-primary mt-1">$499/year billed annually</p>
                )}
              </div>
            ))}
          </motion.div>

          {/* Feature comparison rows */}
          <motion.div
            className="glass-card rounded-t-none overflow-hidden"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            {features.map((f, i) => (
              <div
                key={f.label}
                className={`grid grid-cols-4 items-center py-3.5 px-4 text-center ${i % 2 === 0 ? "bg-white/[0.02]" : ""} ${i < features.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <span className="text-sm text-foreground/70 text-left">{f.label}</span>
                <CellValue value={f.free} />
                <CellValue value={f.basic} />
                <CellValue value={f.pro} />
              </div>
            ))}
          </motion.div>

          {/* CTA buttons row */}
          <motion.div
            className="grid grid-cols-4 gap-0 mt-0"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <div />
            {[
              { cta: "Start Free", variant: "outline" as const },
              { cta: "Choose Basic", variant: "outline" as const },
              { cta: "Go Pro", variant: "hero" as const },
            ].map((plan) => (
              <div key={plan.cta} className="p-4 text-center">
                <Link to="/auth">
                  <Button variant={plan.variant} size="lg" className="w-full">
                    {plan.cta} {plan.variant === "hero" && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </Link>
              </div>
            ))}
          </motion.div>
            </div>
          </div>

          <motion.p
            className="text-center text-xs text-muted-foreground/50 mt-8"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            All plans include access to general informational resources. Prices in USD. Cancel anytime — no hidden fees.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
