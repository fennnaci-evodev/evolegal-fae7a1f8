import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { isRateLimited } from "@/lib/security";

import { fadeUp } from "@/lib/animations";
const Contact = () => {
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (isRateLimited("contact_form", 5, 60_000)) {
      toast.error("Too many submissions. Please wait a moment.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 px-6 relative z-10">
        <div className="container mx-auto max-w-2xl">
          <motion.div className="text-center mb-12" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Questions about our services? We'd love to hear from you.
            </p>
          </motion.div>

          <motion.div
            className="glass-card p-8"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@evolegal.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-accent" />
                <span>Live chat available</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                <input type="text" name="company_url" autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Name</Label>
                  <Input placeholder="Your name" className="bg-muted/30 border-border/50" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input type="email" placeholder="you@example.com" className="bg-muted/30 border-border/50" required maxLength={255} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Subject</Label>
                <Input placeholder="How can we help?" className="bg-muted/30 border-border/50" required maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Message</Label>
                <Textarea placeholder="Tell us more..." rows={5} className="bg-muted/30 border-border/50 resize-none" required maxLength={2000} />
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={sending}>
                {sending ? "Sending..." : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground/50 text-center mt-4">
              This contact form is for general inquiries only. Submitting information does not create any professional relationship.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
