
-- Create hugo_chats table
CREATE TABLE public.hugo_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hugo_messages table
CREATE TABLE public.hugo_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.hugo_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_hugo_chats_user_id ON public.hugo_chats(user_id);
CREATE INDEX idx_hugo_chats_updated_at ON public.hugo_chats(updated_at DESC);
CREATE INDEX idx_hugo_messages_chat_id ON public.hugo_messages(chat_id);
CREATE INDEX idx_hugo_messages_created_at ON public.hugo_messages(created_at);

-- Enable RLS
ALTER TABLE public.hugo_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for hugo_chats
CREATE POLICY "Users can view own chats"
  ON public.hugo_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
  ON public.hugo_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON public.hugo_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON public.hugo_chats FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats"
  ON public.hugo_chats FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for hugo_messages
CREATE POLICY "Users can view own chat messages"
  ON public.hugo_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hugo_chats
    WHERE hugo_chats.id = hugo_messages.chat_id
    AND hugo_chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chat messages"
  ON public.hugo_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hugo_chats
    WHERE hugo_chats.id = hugo_messages.chat_id
    AND hugo_chats.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all messages"
  ON public.hugo_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_hugo_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.hugo_chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_hugo_chat_timestamp
AFTER INSERT ON public.hugo_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_hugo_chat_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hugo_messages;
