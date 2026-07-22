import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Search, UserCheck, ArrowRight } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Share Your Question",
    desc: "Describe the topic you'd like to understand — share key facts, upload documents, and optionally select your state for context. Available for US residents anywhere.",
  },
  {
    icon: Search,
    number: "02",
    title: "Hugo Researches & Drafts",
    desc: "Hugo and our team research from a vast base of cases, legislation, and public legal frameworks to prepare a comprehensive, structured overview covering processes, terminology, risks, and options.",
  },
  {
    icon: UserCheck,
    number: "03",
    title: "Expert Review & Delivery",
    desc: "Every response is reviewed by an EvoLegal Expert for accuracy and completeness, then delivered to your portal. You will get your answer as soon as possible — it always depends on the complexity of your case. Typical turnaround: 4 hours for Pro, 8 hours for Basic.",
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
              Three simple steps from question to clarity — Hugo and our Experts are here to help, for Americans nationwide.
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
            <h3 className="text-xl font-display font-semibold mb-3">Quality You Can Trust</h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Every response is carefully reviewed by our Experts — structured with Options → Risks → Resources.<br />
              You will get your answer as soon as possible. It always depends on the complexity of your case.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Ask Hugo <ArrowRight className="ml-2 h-4 w-4" />
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
