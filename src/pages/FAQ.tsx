import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ChevronDown } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const faqs = [
  {
    q: "Is EvoLegal a law firm?",
    a: "No. EvoLegal provides general informational and educational resources only. We are not a law firm, and our Experts are not licensed attorneys. No attorney-client relationship is formed.",
  },
  {
    q: "What kind of help can I get?",
    a: "We provide general explanations of legal processes, video lectures, guides, templates, and informational Q&A. For matters requiring legal representation, we recommend consulting a licensed professional.",
  },
  {
    q: "Can you give me advice about my specific case?",
    a: "We provide general information only — not advice tailored to your personal situation. For complex or personal matters, professional legal representation may be recommended. We can help you prepare and understand the landscape.",
  },
  {
    q: "How does the AI Expert Manager work?",
    a: "Our Expert Manager uses AI to provide general educational information on legal topics. Responses focus on processes, terms, risks, and comparisons — always depersonalized. A human Expert reviews flagged or complex queries.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. You can cancel at any time from your account settings. No hidden fees, no lock-in contracts.",
  },
  {
    q: "Do you cover UK law?",
    a: "Yes! We uniquely cover both US law (NY-focused) and English (UK) law — particularly useful for NY residents dealing with UK matters related to tenancy or family proceedings.",
  },
  {
    q: "What topics do you cover?",
    a: "We currently focus on Tenant-Landlord and Family Law for both NY (US) and England (UK). We're expanding to Insurance, Injury Law, and additional topics.",
  },
  {
    q: "How is my data protected?",
    a: "All data is encrypted in transit and at rest. Documents are stored securely. We follow strict data protection practices and never share your information with third parties.",
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
            <p className="text-lg text-muted-foreground">Everything you need to know about EvoLegal.</p>
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
