-- Create hugo_metrics table for self-improvement tracking
CREATE TABLE public.hugo_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.hugo_chats(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'chat',
  clarity_score SMALLINT CHECK (clarity_score >= 0 AND clarity_score <= 100),
  relevance_score SMALLINT CHECK (relevance_score >= 0 AND relevance_score <= 100),
  conciseness_score SMALLINT CHECK (conciseness_score >= 0 AND conciseness_score <= 100),
  empathy_score SMALLINT CHECK (empathy_score >= 0 AND empathy_score <= 100),
  risk_accuracy_score SMALLINT CHECK (risk_accuracy_score >= 0 AND risk_accuracy_score <= 100),
  escalation_score SMALLINT CHECK (escalation_score >= 0 AND escalation_score <= 100),
  context_retention_score SMALLINT CHECK (context_retention_score >= 0 AND context_retention_score <= 100),
  title_quality_score SMALLINT CHECK (title_quality_score >= 0 AND title_quality_score <= 100),
  doc_safety_score SMALLINT CHECK (doc_safety_score >= 0 AND doc_safety_score <= 100),
  doc_structure_score SMALLINT CHECK (doc_structure_score >= 0 AND doc_structure_score <= 100),
  overall_score SMALLINT CHECK (overall_score >= 0 AND overall_score <= 100),
  retention_score SMALLINT CHECK (retention_score >= 0 AND retention_score <= 100),
  weakest_areas TEXT,
  ethics_flags TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hugo_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view metrics
CREATE POLICY "Admins can view all metrics"
ON public.hugo_metrics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (from edge functions)
CREATE POLICY "Service can insert metrics"
ON public.hugo_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for efficient dashboard queries
CREATE INDEX idx_hugo_metrics_created_at ON public.hugo_metrics(created_at DESC);
CREATE INDEX idx_hugo_metrics_chat_id ON public.hugo_metrics(chat_id);
CREATE INDEX idx_hugo_metrics_type ON public.hugo_metrics(interaction_type);