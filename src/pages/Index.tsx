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
import { PRODUCT_PLANS } from "@/lib/pricing";
const offerings = [
  { icon: PlayCircle, title: "Contract Audit", desc: "Isolate material exposure and non-standard terms with structured analysis." },
  { icon: BookOpen, title: "Audit Resources", desc: "Apply concise frameworks, checklists, and controlled templates." },
  { icon: MessageCircle, title: "Hugo Co-Pilot", desc: "Extract key terms and evaluate legal concepts with clear supporting context." },
];

const whyUs = [
  { icon: Zap, title: "Accelerated Review", desc: "Move from document intake to structured findings without delay." },
  { icon: Shield, title: "Auditable Outputs", desc: "Review defined findings, risk context, and supporting resources." },
  { icon: Globe, title: "US & UK Coverage", desc: "Compare English and US legal concepts within a consistent framework." },
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <DisclaimerModal />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
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
            <span className="hero-neon-cycle hero-neon-emphasis">Precision Contract Intelligence.</span>
          </motion.h1>

          <motion.div
            className="max-w-2xl mx-auto mb-10 space-y-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <p className="text-base md:text-lg font-display font-medium hero-sub-glow leading-relaxed">
              Scan complex agreements, isolate critical exposure, and accelerate deal flow—with enterprise-grade accuracy.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Structured contract analysis with clear findings, traceable context, and expert review pathways.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Run Legal Audit <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="glass" size="xl">
                Explore Sample Audit
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Contract Intelligence Stack</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Audit agreements, extract obligations, and validate key terms in one structured workflow.</p>
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
            <p className="text-muted-foreground max-w-md mx-auto">Built for precise review, accountable outputs, and faster decisions.</p>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Coverage Areas</h2>
            <p className="text-muted-foreground">Structured information across contracts, employment, tenancy, insurance, disputes, and US–UK legal concepts.</p>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Sample Analysis</h2>
            <p className="text-muted-foreground">Review the structure, depth, and source context before selecting a plan.</p>
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
            <p className="text-muted-foreground">Defined limits, transparent rates, and flexible plan control.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCT_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`glass-card p-7 pt-8 flex flex-col relative overflow-visible ${plan.highlighted ? "gradient-border glow-cyan" : ""}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold whitespace-nowrap z-10 shadow-lg">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-display font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <div className="mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full" variant={plan.highlighted ? "hero" : "outline"} size="lg">
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Move from Clause to Decision.</h2>
            <p className="text-muted-foreground mb-8">Launch a structured review and isolate the terms that require attention.</p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Run Legal Audit <ArrowRight className="ml-2 h-5 w-5" />
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
