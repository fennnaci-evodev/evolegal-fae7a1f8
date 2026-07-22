import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { EvoLogo } from "@/components/EvoLogo";
import { HugoDemoBubble } from "@/components/HugoDemoBubble";
import { ArrowRight, PlayCircle, BookOpen, MessageCircle, Shield, Zap, Globe, Check, ChevronRight } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const offerings = [
  { icon: PlayCircle, title: "Contract Audit", desc: "Spot hidden risks and imbalanced clauses in seconds." },
  { icon: BookOpen, title: "Clear Guides", desc: "Concise walkthroughs and templates you can actually use." },
  { icon: MessageCircle, title: "Ask Hugo", desc: "A calm, articulate co-pilot for everyday legal questions." },
];

const whyUs = [
  { icon: Zap, title: "Answers in Seconds", desc: "No waiting rooms. No bureaucracy." },
  { icon: Shield, title: "Transparent", desc: "Flat pricing. Cancel anytime." },
  { icon: Globe, title: "US & UK Coverage", desc: "Dual-jurisdiction clarity, built for Americans." },
];

const topics = [
  "Tenant Rights (US)", "Landlord Obligations (US)", "UK Tenancy Law", "Family Court (US)",
  "UK Divorce Process", "Lease Agreements", "Child Custody Overview", "Eviction Procedures",
  "Security Deposits", "Mediation Basics", "Personal Injury (US)", "Insurance Claims",
  "Employment Basics", "Contract Disputes", "Crypto Law (US & UK)",
];

const sampleContent = [
  { title: "The Basics of Tenant-Landlord Law in the US", type: "Article", duration: "18 min read", free: true, to: "/blog/tenant-landlord-basics" },
  { title: "5 Key Differences: NY vs UK Tenant Rights", type: "Article", duration: "5 min read", free: true, to: "/blog" },
  { title: "What Happens in a NY Family Court Hearing?", type: "Video", duration: "12 min", free: true, to: "/blog" },
  { title: "Understanding Your UK Tenancy Agreement", type: "Guide", duration: "6 min read", free: true, to: "/blog" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Explore the basics",
    features: ["Unlimited articles", "3 videos/month", "1 short chat session/month", "Community resources"],
    cta: "Get Started",
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
    features: ["Everything in Basic", "Unlimited submissions", "Priority ~4h turnaround", "Deep-dive exclusive content", "Full Case File portal", "Human Expert consultations"],
    cta: "Go Pro",
    highlight: false,
    annual: "$499/year (save 20%)",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <DisclaimerModal />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <motion.div
            className="relative mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <EvoLogo size="hero" animate showText={false} />
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 hero-headline-glow"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <span className="hero-neon-cycle hero-neon-emphasis">
              EVOLEGAL
              <span className="hero-logo-separator" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="hero-sep-main" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                      <stop offset="50%" stopColor="hsl(186 100% 50%)" />
                      <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                    </linearGradient>
                    <linearGradient id="hero-sep-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsla(270 80% 75% / 0.35)" />
                      <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
                    </linearGradient>
                  </defs>
                  <path d="M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z" fill="url(#hero-sep-main)" />
                  <path d="M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z" fill="url(#hero-sep-rim)" />
                </svg>
              </span>
              THE FUTURE OF LEGAL INTELLIGENCE
            </span>
          </motion.h1>

          <motion.div
            className="max-w-2xl mx-auto mb-10 space-y-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <p className="text-base md:text-lg font-display font-medium hero-sub-glow leading-relaxed">
              Scan contracts, uncover hidden risks, and get actionable answers — without the bureaucracy.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Hugo is your calm, articulate co-pilot for US & UK legal matters.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Ask Hugo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="glass" size="xl">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground/40"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            General informational resources reviewed by EvoLegal Experts.
          </motion.p>

        </div>
      </section>

      <div className="neon-line container mx-auto relative z-10" />

      {/* What We Offer */}
      <section id="offerings" className="py-20 md:py-28 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">What We Offer</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything you need to move forward with confidence.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {offerings.map((item, i) => (
              <motion.div
                key={item.title}
                className="glass-card p-8"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why EvoLegal */}
      <section className="py-20 md:py-28 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Why EvoLegal</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Precision engineering meets effortless simplicity.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                className="text-center p-8"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Topics We Cover</h2>
            <p className="text-muted-foreground">Tenant-Landlord, Family, Personal Injury, Insurance, Employment, Contracts, Crypto Law & more.</p>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-2.5"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            {topics.map((topic) => (
              <span key={topic} className="glass rounded-full px-4 py-2 text-sm text-foreground/80 cursor-default hover:border-primary/20 transition-all duration-300">
                {topic}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sample Content */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Free Samples</h2>
            <p className="text-muted-foreground">Try before you commit. Explore our free content.</p>
          </motion.div>

          <div className="space-y-3">
            {sampleContent.map((item, i) => (
              <Link to={item.to} key={item.title}>
                <motion.div
                  className="glass-card p-5 flex items-center justify-between cursor-pointer"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {item.type === "Video" ? <PlayCircle className="h-5 w-5 text-primary" /> : <BookOpen className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.type} · {item.duration}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="neon-line container mx-auto relative z-10" />

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 px-6 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Transparent Pricing</h2>
            <p className="text-muted-foreground">No hidden fees. Cancel anytime. Upgrade or downgrade freely.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`glass-card p-7 pt-8 flex flex-col relative overflow-visible ${plan.highlight ? "gradient-border glow-cyan" : ""}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold whitespace-nowrap z-10 shadow-lg">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-display font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-1">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                {plan.annual && <p className="text-xs text-primary mb-4">{plan.annual}</p>}
                {!plan.annual && <div className="mb-4" />}
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Clarity Is One Question Away.</h2>
            <p className="text-muted-foreground mb-8">Start your first analysis in seconds. No card required.</p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Ask Hugo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <HugoDemoBubble />
      <Footer />
    </div>
  );
};

export default Index;
