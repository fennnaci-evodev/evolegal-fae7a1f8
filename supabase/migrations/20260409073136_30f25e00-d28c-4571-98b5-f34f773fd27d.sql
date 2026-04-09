
CREATE POLICY "Users can delete own chat messages"
ON public.hugo_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM hugo_chats
    WHERE hugo_chats.id = hugo_messages.chat_id
      AND hugo_chats.user_id = auth.uid()
  )
);
