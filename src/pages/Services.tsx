import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle, PlayCircle, FileText, Briefcase, ArrowRight } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const services = [
  {
    icon: MessageCircle,
    title: "Hugo Co-Pilot",
    desc: "Extract terms, test assumptions, and review legal concepts through a persistent analysis workspace.",
    features: ["Rapid responses", "General information only", "Traceable chat history", "Expert escalation"],
  },
  {
    icon: PlayCircle,
    title: "Expert Briefings",
    desc: "Structured briefings cover key English and US legal frameworks, processes, and terminology.",
    features: ["Expert-led content", "US & UK coverage", "Sample briefings", "Monthly updates"],
  },
  {
    icon: FileText,
    title: "Frameworks & Templates",
    desc: "Controlled templates, audit checklists, and structured self-help resources with clear usage boundaries.",
    features: ["Downloadable PDFs", "Audit checklists", "Term glossaries", "Counsel review questions"],
  },
  {
    icon: Briefcase,
    title: "Counsel Preparation",
    desc: "Organize facts, documents, timelines, and review questions before consulting licensed counsel.",
    features: ["Matter-specific preparation", "Priority questions", "Document checklists", "Timeline templates"],
  },
];

const Services = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Structured legal information designed for precise review, efficient preparation, and accountable decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                className="glass-card p-8"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Niche */}
          <motion.div
            className="glass-card p-8 mt-8 text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
          >
            <h3 className="text-xl font-display font-semibold mb-3">Cross-Jurisdiction Coverage</h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Review general US legal concepts and comparative English-law frameworks through one consistent analysis standard. Jurisdiction-specific matters may require licensed local counsel.
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

export default Services;
