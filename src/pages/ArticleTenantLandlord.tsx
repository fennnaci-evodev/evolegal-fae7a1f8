import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { fadeUp } from "@/lib/animations";
import tenantImage from "@/assets/tenant-landlord-article.jpg";

const ArticleTenantLandlord = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <article className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          {/* Back link */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">Tenant-Landlord</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">US Nationwide</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 18 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4">
              The Basics of Tenant-Landlord Law in the United States
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              A comprehensive general overview of the rights, responsibilities, and legal frameworks governing residential rentals across all 50 states.
            </p>
          </motion.div>

          {/* Hero image */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mb-10">
            <div className="glass-card overflow-hidden p-0" style={{ borderRadius: "1.5rem" }}>
              <img
                src={tenantImage}
                alt="Landlord and tenant meeting outside a modern residential building"
                className="w-full aspect-[16/9] object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Disclaimer bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mb-10">
            <div className="glass rounded-xl px-5 py-3 flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                This article provides general informational and educational content only. Laws vary significantly by state and locality. For your specific situation, consult a licensed attorney in your jurisdiction.
              </p>
            </div>
          </motion.div>

          {/* Article content */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="prose-article space-y-8">
            <p className="text-foreground/90 leading-relaxed text-[15px]">
              Tenant-landlord law governs the relationship between renters (tenants) and property owners or managers (landlords) in residential rentals. This area of law balances the rights and responsibilities of both parties to ensure fair treatment, safe housing, and clear procedures for disputes. While some rules come from federal law, most are determined by state statutes, local ordinances, and common law. Many states draw from or adapt the Uniform Residential Landlord and Tenant Act (URLTA), a model law aimed at standardizing key aspects, though adoption varies.
            </p>
            <p className="text-foreground/90 leading-relaxed text-[15px]">
              Because laws differ significantly by state (and sometimes by city or county), this article provides a general U.S. overview. Always check your specific state's laws (often through attorney general websites, state statutes, or resources like Nolo or FindLaw) or consult a local legal professional for precise guidance.
            </p>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Federal Laws That Apply Nationwide</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">Certain protections apply everywhere in the U.S.:</p>
              <ul className="space-y-3">
                <li className="glass rounded-xl p-4">
                  <strong className="text-foreground">Fair Housing Act (1968)</strong>
                  <span className="text-foreground/80 text-sm"> — Prohibits discrimination in housing based on race, color, national origin, religion, sex (including gender identity and sexual orientation), familial status, or disability. Landlords cannot refuse to rent, set different terms, or harass based on these protected classes. Additional protections may apply under state laws.</span>
                </li>
                <li className="glass rounded-xl p-4">
                  <strong className="text-foreground">Lead-Based Paint Disclosure</strong>
                  <span className="text-foreground/80 text-sm"> — For properties built before 1978, landlords must disclose known lead hazards and provide an EPA pamphlet.</span>
                </li>
              </ul>
              <p className="text-foreground/80 text-sm mt-3">Other federal rules cover aspects like mold in some cases or reasonable accommodations for disabilities (e.g., allowing service animals or modifications).</p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Lease Agreements: The Foundation</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">
                The lease (or rental agreement) is a contract outlining the tenancy terms. It can be written or oral, though written is strongly recommended to avoid disputes.
              </p>
              <p className="text-foreground/90 text-[15px] mb-3 font-medium">Key elements typically include:</p>
              <div className="glass-card p-6">
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Rent amount, due date, and payment method</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Lease duration (fixed-term, e.g., 1 year, or periodic/month-to-month)</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Security deposit rules</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Responsibilities for utilities, maintenance, and repairs</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Rules on pets, guests, subletting, or alterations</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Termination and renewal procedures</li>
                </ul>
              </div>
              <p className="text-foreground/80 text-sm mt-3">Both parties must act in good faith and deal fairly.</p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Key Rights and Responsibilities of Landlords</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">
                Landlords own or manage the property and have these core obligations:
              </p>
              <div className="space-y-3">
                {[
                  { title: "Provide Habitable Housing", desc: "Most states imply a warranty of habitability, requiring the unit to meet basic health and safety standards (e.g., working plumbing, heat, electricity, no major pests, secure locks, compliance with building codes). Landlords must make necessary repairs in a reasonable time after notification." },
                  { title: "Maintain Common Areas", desc: "Keep shared spaces (e.g., hallways, stairs) safe and clean." },
                  { title: "Respect Privacy and Quiet Enjoyment", desc: "Give reasonable notice (often 24-48 hours) before entering, except in emergencies. Avoid interfering with the tenant's use of the property." },
                  { title: "Handle Security Deposits Properly", desc: "Limits vary by state (e.g., often 1-2 months' rent). Landlords must return the deposit (minus deductions for damage beyond normal wear and tear) within a set time (e.g., 14-60 days) and provide an itemized accounting." },
                  { title: "Follow Eviction Rules", desc: "Cannot use \"self-help\" evictions (e.g., changing locks or shutting off utilities). Must go through court for formal eviction." },
                  { title: "No Retaliation", desc: "Cannot evict or raise rent in retaliation for tenants exercising rights (e.g., reporting violations)." },
                ].map((item) => (
                  <div key={item.title} className="glass rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-foreground/80 text-sm mt-3">
                Landlords can set reasonable rules, collect rent on time, screen applicants (following fair housing and credit reporting laws), and evict for valid reasons like nonpayment or lease violations.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Key Rights and Responsibilities of Tenants</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">Tenants pay rent for exclusive use of the property and have these protections:</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  "Right to a Safe, Habitable Home",
                  "Privacy and Quiet Enjoyment",
                  "Protection from Discrimination and Retaliation",
                  "Security Deposit Return Rights",
                ].map((right) => (
                  <div key={right} className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span className="text-sm text-foreground/90 font-medium">{right}</span>
                  </div>
                ))}
              </div>
              <p className="text-foreground/90 text-[15px] mb-3 font-medium">Tenants must:</p>
              <div className="glass-card p-6">
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" /> Pay rent on time</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" /> Keep the unit clean and avoid damage beyond normal wear and tear</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" /> Follow lease rules (e.g., no illegal activity)</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" /> Allow access for repairs/inspections with proper notice</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-2" /> Give notice when moving out (often 30 days for month-to-month)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Security Deposits</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">A common source of disputes. Rules vary by state:</p>
              <div className="glass-card p-6">
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Maximum amounts (e.g., 1-2 months' rent in many states)</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Deductions allowed only for unpaid rent, damage beyond wear/tear, or cleaning</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Return deadlines and requirements for written explanations</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Some states require deposits in interest-bearing accounts</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Evictions and Lease Termination</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px]">
                Evictions require court process in nearly all states. "Self-help" is illegal. Grounds include nonpayment, lease violations, or end of term (with proper notice). Many states now require "just cause" in certain cases, especially post-lease protections.
              </p>
              <p className="text-foreground/90 leading-relaxed text-[15px] mt-3">
                For month-to-month tenancies, notice periods vary (often 30 days). Fixed-term leases end automatically unless renewed.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Other Common Topics</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: "Rent Increases", desc: "Generally allowed unless rent-controlled. Notice required." },
                  { title: "Repairs", desc: "Tenants should notify in writing; landlords must respond reasonably." },
                  { title: "Subleasing", desc: "Often restricted without landlord permission." },
                  { title: "Pets and Fees", desc: "Rules vary; some states limit pet deposits." },
                ].map((topic) => (
                  <div key={topic.title} className="glass rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">{topic.title}</h4>
                    <p className="text-xs text-foreground/80">{topic.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Final Tips</h2>
              <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">
                Landlord-tenant disputes often resolve through communication, but serious issues may need mediation, small claims court, or legal aid. Resources include:
              </p>
              <div className="glass-card p-6">
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> State attorney general offices</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> HUD (for fair housing)</li>
                  <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" /> Local tenant unions or legal aid societies</li>
                </ul>
              </div>
              <p className="text-foreground/90 leading-relaxed text-[15px] mt-4">
                Understanding these basics promotes smoother tenancies and helps avoid costly conflicts. Laws evolve, so verify current rules in your area.
              </p>
            </section>

            {/* Bottom disclaimer */}
            <div className="glass-card p-6 mt-8">
              <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
                This article is for general informational and educational purposes only. It does not constitute legal advice or create any professional relationship. Laws vary significantly by state and jurisdiction — for your specific situation, consult a licensed attorney in your area.
              </p>
            </div>
          </motion.div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ArticleTenantLandlord;
