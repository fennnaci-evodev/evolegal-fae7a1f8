
-- Create feedback table for Hugo message ratings
CREATE TABLE public.hugo_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hugo_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback on their own chats
CREATE POLICY "Users can insert own feedback"
ON public.hugo_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.hugo_chats
    WHERE hugo_chats.id = hugo_feedback.chat_id
    AND hugo_chats.user_id = auth.uid()
  )
);

-- Users can view own feedback
CREATE POLICY "Users can view own feedback"
ON public.hugo_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update own feedback
CREATE POLICY "Users can update own feedback"
ON public.hugo_feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.hugo_feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
