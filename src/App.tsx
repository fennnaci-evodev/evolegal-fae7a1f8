import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { InitialLoader } from "@/components/InitialLoader";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ExpertChat from "./pages/ExpertChat";
import UserChat from "./pages/UserChat";
import Library from "./pages/Library";
import SubmitRequest from "./pages/SubmitRequest";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import ArticleTenantLandlord from "./pages/ArticleTenantLandlord";
import ResetPassword from "./pages/ResetPassword";
import MyRequests from "./pages/MyRequests";
import AdminRequests from "./pages/AdminRequests";
import ExpertDashboard from "./pages/ExpertDashboard";
import WorkflowGuides from "./pages/WorkflowGuides";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const handleInitialComplete = useCallback(() => setInitialLoaded(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {!initialLoaded && <InitialLoader onComplete={handleInitialComplete} />}
            <LoadingOverlay />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/services" element={<Services />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/tenant-landlord-basics" element={<ArticleTenantLandlord />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/chat" element={<ExpertChat />} />
                <Route path="/dashboard/library" element={<Library />} />
                <Route path="/dashboard/submit" element={<SubmitRequest />} />
                <Route path="/dashboard/requests" element={<MyRequests />} />
                <Route path="/dashboard/admin/requests" element={<AdminRequests />} />
                <Route path="/dashboard/admin/workdesk" element={<ExpertDashboard />} />
                <Route path="/dashboard/workflows" element={<WorkflowGuides />} />
                <Route path="/dashboard/saved" element={<Library />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LoadingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
