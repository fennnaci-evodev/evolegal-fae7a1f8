import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ChevronDown } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const faqs = [
  {
    q: "What is EvoLegal?",
    a: "EvoLegal is a platform where our Experts — led by Hugo, your Expert Manager — provide structured, well-researched insights on US and English (UK) legal topics. We draw from a vast base of cases and legislation to help you understand your options clearly.",
  },
  {
    q: "Who is Hugo?",
    a: "Hugo is your Expert Manager — the first point of contact when you have a question. Hugo works hard to deliver detailed, objective, and helpful responses on legal topics. For more complex needs, one of our Legal Experts is always ready to assist.",
  },
  {
    q: "What kind of help can I get?",
    a: "We provide structured insights on legal processes, video lectures, guides, templates, and expert Q&A. Hugo and our team cover tenant-landlord, family, personal injury, insurance, employment, and contract topics across both US and UK law.",
  },
  {
    q: "Does this cover all US states?",
    a: "Yes — our insights cover general legal frameworks applicable nationwide. Since laws vary by state, we always note where variations exist. For jurisdiction-specific matters, our team can point you in the right direction.",
  },
  {
    q: "How fast will I get a response?",
    a: "Typical turnaround: 4 hours for Pro, 8 hours for Basic. Hugo handles many questions instantly, and our Legal Experts review complex submissions promptly.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. Cancel at any time from your account settings — no hidden fees, no lock-in contracts. We believe in earning your trust every month.",
  },
  {
    q: "Do you cover UK law?",
    a: "Yes! We uniquely cover both US and English (UK) law — particularly helpful for Americans dealing with UK tenancy or family matters, or anyone wanting comparative insights.",
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
