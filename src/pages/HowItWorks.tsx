import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Search, UserCheck, ArrowRight } from "lucide-react";

import { fadeUp } from "@/lib/animations";
import { EXPERT_REVIEW_EXPECTATION } from "@/lib/pricing";
const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Define the Review",
    desc: "Provide the agreement, objective, and relevant commercial context. Add jurisdiction details where they affect the analysis.",
  },
  {
    icon: Search,
    number: "02",
    title: "Hugo Audits the Terms",
    desc: "Hugo isolates obligations, exposure, non-standard provisions, and decision points within a structured review framework.",
  },
  {
    icon: UserCheck,
    number: "03",
    title: "Validate and Deliver",
    desc: `Expert review provides quality assurance and oversight. ${EXPERT_REVIEW_EXPECTATION}`,
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              How <span className="text-gradient">EvoLegal</span> Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              A controlled workflow from document intake to structured, review-ready findings.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-6 mb-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="glass-card p-8 flex flex-col md:flex-row items-start gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-3xl font-display font-bold text-primary/30">{step.number}</span>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quality assurance */}
          <motion.div
            className="glass-card p-8 text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
          >
            <h3 className="text-xl font-display font-semibold mb-3">Review Standards</h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Outputs follow a consistent Options → Risks → Resources structure.<br />
              Expert review provides quality assurance and oversight where included in your plan.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Launch Hugo Co-Pilot <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
