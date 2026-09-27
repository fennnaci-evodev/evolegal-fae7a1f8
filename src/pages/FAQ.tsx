import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ChevronDown } from "lucide-react";

import { fadeUp } from "@/lib/animations";
import { EXPERT_REVIEW_EXPECTATION } from "@/lib/pricing";
const faqs = [
  {
    q: "What is EvoLegal?",
    a: "EvoLegal provides structured analysis of English and US legal concepts. Hugo organizes findings through consistent frameworks, with expert review available for complex matters.",
  },
  {
    q: "Who is Hugo?",
    a: "Hugo is EvoLegal’s analysis co-pilot for extracting terms, comparing frameworks, and identifying risk. Expert validation is available when a matter requires human review.",
  },
  {
    q: "What kind of help can I get?",
    a: "EvoLegal provides structured analysis, expert briefings, controlled templates, and review workflows. Coverage includes contracts, employment, tenancy, insurance, disputes, and English–US comparisons.",
  },
  {
    q: "Does this cover all US states?",
    a: "EvoLegal covers general US legal frameworks nationwide and identifies where state-level variation matters. Jurisdiction-specific questions may require licensed local counsel.",
  },
  {
    q: "How fast will I get a response?",
    a: `Hugo provides rapid initial analysis. ${EXPERT_REVIEW_EXPECTATION}`,
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Cancel at any time from account settings; pricing and plan limits remain visible before selection.",
  },
  {
    q: "Do you cover UK law?",
    a: "Yes. EvoLegal covers English law and US legal concepts, including structured comparative analysis where frameworks diverge.",
  },
  {
    q: "How is my data protected?",
    a: "Data is encrypted in transit and at rest, and documents are stored securely. Access controls and retention practices protect analysis records.",
  },
];

function FaqItem({ item, index }: { item: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={index}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-display font-medium pr-4">{item.q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <motion.div className="text-center mb-14" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground">Platform scope, review standards, coverage, and account controls.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} item={faq} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
