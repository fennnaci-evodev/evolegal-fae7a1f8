import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { fadeUp } from "@/lib/animations";

const SubmitRequest = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Request submitted! You'll receive a response within 24 hours.");
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl font-display font-bold mb-2">Submit a Request</h1>
          <p className="text-muted-foreground">Describe your topic and we'll prepare a detailed, general informational response.</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-card p-8 space-y-5"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          <div className="space-y-2">
            <Label className="text-sm font-display">Topic Area</Label>
            <select className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground">
              <option value="">Select a topic...</option>
              <option value="tenant-ny">Tenant-Landlord (NY)</option>
              <option value="tenant-uk">Tenant-Landlord (UK)</option>
              <option value="family-ny">Family Law (NY)</option>
              <option value="family-uk">Family Law (UK)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Describe Your Topic</Label>
            <Textarea
              placeholder="Describe what you'd like general information about. Include any relevant context or specific terms you'd like explained..."
              rows={5}
              className="bg-muted/30 border-border/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Key Facts (Optional)</Label>
            <Textarea
              placeholder="List any relevant facts, such as jurisdiction, dates, or specific terminology..."
              rows={3}
              className="bg-muted/30 border-border/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Upload Documents (Optional)</Label>
            <div className="glass rounded-xl p-6 text-center cursor-pointer hover:border-primary/20 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground/50 mt-1">PDF, DOC, TXT — Max 10MB</p>
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : <>Submit Request <Send className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="text-xs text-muted-foreground/50 text-center">
            Responses provide general information only. For your specific circumstances, please consult a licensed professional.
          </p>
        </motion.form>
      </div>
    </DashboardLayout>
  );
};

export default SubmitRequest;
