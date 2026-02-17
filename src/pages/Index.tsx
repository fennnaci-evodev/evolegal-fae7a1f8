import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, PlayCircle, BookOpen, MessageCircle, Shield, Zap, Globe, ArrowRight, Check } from "lucide-react";
import { DisclaimerModal } from "@/components/DisclaimerModal";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6 }
  }),
};

const offerings = [
  { icon: PlayCircle, title: "Video Lectures", desc: "Pre-recorded explanations on US & UK legal topics by subject matter experts." },
  { icon: BookOpen, title: "Guides & Templates", desc: "Step-by-step guides and generic templates with full disclaimers." },
  { icon: MessageCircle, title: "Expert Consultations", desc: "General Q&A with our Expert Managers for informational guidance." },
];

const whyUs = [
  { icon: Zap, title: "Instant Access", desc: "No waiting. Get resources immediately." },
  { icon: Shield, title: "Transparent Pricing", desc: "No hidden fees, no surprise charges." },
  { icon: Globe, title: "US & UK Coverage", desc: "Dual-jurisdiction general info — NY focus + English law." },
];

const topics = [
  "Tenant-Landlord (NY)", "Family Law Basics (NY)", "Tenant Rights (UK)", "Family Proceedings (UK)",
  "Lease Agreements", "Eviction Processes", "Child Custody Overview", "Divorce Procedures",
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: ["Limited video access", "Basic guides", "Community resources"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$24",
    period: "/mo",
    features: ["All videos & guides", "AI Expert Manager chat", "Topic bookmarks", "Email support"],
    cta: "Subscribe Now",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$59",
    period: "/mo",
    features: ["Everything in Basic", "Unlimited access", "Human Expert consultations", "Priority scheduling", "Downloadable resources"],
    cta: "Go Pro",
    highlight: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DisclaimerModal />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gradient">EvoLegal</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#offerings" className="hover:text-foreground transition-colors">Offerings</a>
            <a href="#topics" className="hover:text-foreground transition-colors">Topics</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary mb-6 glass">
              General Information Only — Not Legal Advice
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <span className="text-gradient">EvoLegal</span>
            <br />
            <span className="text-foreground">Clear Insights on</span>
            <br />
            <span className="text-foreground">US & English Law</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            General explanations, video lectures & exam prep resources.
            <br className="hidden md:block" />
            Affordable, transparent, and instantly accessible.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/auth">
              <Button size="lg" className="glow-cyan text-base px-8">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button variant="outline" size="lg" className="text-base px-8">
                View Pricing
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="neon-line container mx-auto" />

      {/* Offerings */}
      <section id="offerings" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Get</h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">Educational resources to help you understand legal processes and terminology.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {offerings.map((item, i) => (
              <motion.div
                key={item.title}
                className="glass rounded-xl p-8 hover:border-primary/30 transition-all group"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-cyan transition-all">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why EvoLegal</h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">Simpler, faster, and more affordable than traditional platforms.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                className="text-center p-8"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section id="topics" className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Topics Covered</h2>
            <p className="text-muted-foreground font-body">Starting with tenant-landlord and family law — expanding soon.</p>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            {topics.map((topic) => (
              <span key={topic} className="glass rounded-full px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 transition-colors cursor-default">
                {topic}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="neon-line container mx-auto" />

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-muted-foreground font-body">No hidden fees. Cancel anytime. Upgrade or downgrade freely.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-xl p-8 flex flex-col ${
                  plan.highlight
                    ? "glass-strong border-primary/40 glow-cyan relative"
                    : "glass"
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-body">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-bold text-gradient">EvoLegal</span>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-md font-body">
              EvoLegal provides general informational and educational resources only. Not legal advice, representation, or a law firm. Always consult a licensed professional.
            </p>
            <p className="text-xs text-muted-foreground">© 2026 EvoLegal</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
