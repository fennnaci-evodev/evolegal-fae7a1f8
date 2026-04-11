-- Fix overly permissive insert policy
DROP POLICY "Service can insert metrics" ON public.hugo_metrics;

CREATE POLICY "Users can insert own metrics"
ON public.hugo_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);