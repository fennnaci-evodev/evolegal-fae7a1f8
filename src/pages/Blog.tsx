import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";

import { fadeUp } from "@/lib/animations";
const posts = [
  {
    title: "5 Key Differences: NY Tenant Rights vs UK Landlord Laws",
    excerpt: "A side-by-side comparison of how tenant protections differ between New York and England — from security deposits to eviction procedures.",
    topic: "Tenant-Landlord",
    date: "Feb 14, 2026",
    readTime: "5 min read",
  },
  {
    title: "What to Expect in a NY Family Court Hearing",
    excerpt: "A general overview of the family court process in New York — types of cases, typical timelines, and how to prepare.",
    topic: "Family Law",
    date: "Feb 10, 2026",
    readTime: "7 min read",
  },
  {
    title: "Understanding UK Assured Shorthold Tenancies",
    excerpt: "The most common form of residential tenancy in England explained — rights, obligations, and common misconceptions.",
    topic: "Tenant-Landlord",
    date: "Feb 6, 2026",
    readTime: "4 min read",
  },
  {
    title: "No-Fault Divorce in England: What Changed in 2020",
    excerpt: "How the Divorce, Dissolution and Separation Act 2020 simplified the divorce process in England and Wales.",
    topic: "Family Law",
    date: "Feb 2, 2026",
    readTime: "6 min read",
  },
  {
    title: "Lease Agreements: Key Terms You Should Understand",
    excerpt: "A glossary of common lease agreement terms and what they generally mean for tenants and landlords.",
    topic: "Tenant-Landlord",
    date: "Jan 28, 2026",
    readTime: "5 min read",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center mb-14" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="text-gradient">Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Free articles and insights on US & UK legal topics.
            </p>
          </motion.div>

          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.article
                key={post.title}
                className="glass-card p-6 md:p-8 cursor-pointer group"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{post.topic}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  <span className="text-xs text-muted-foreground/50">{post.date}</span>
                </div>
                <h2 className="text-lg font-display font-semibold mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{post.excerpt}</p>
                <span className="text-sm text-primary flex items-center gap-1 font-medium">
                  Read more <ArrowRight className="h-3 w-3" />
                </span>
              </motion.article>
            ))}
          </div>

          <motion.p
            className="text-center text-xs text-muted-foreground/50 mt-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={6}
          >
            All blog content is for general informational purposes only.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
