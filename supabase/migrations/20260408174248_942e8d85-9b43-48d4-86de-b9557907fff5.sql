
-- Add ticket_number and assigned_at columns to legal_requests
ALTER TABLE public.legal_requests
  ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

-- Create index for fast ticket lookup
CREATE INDEX IF NOT EXISTS idx_legal_requests_ticket_number ON public.legal_requests (ticket_number);

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_str TEXT;
  seq_num INT;
  ticket TEXT;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ticket_number FROM 'EVO-\d{8}-(\d+)') AS INT)
  ), 0) + 1
  INTO seq_num
  FROM public.legal_requests
  WHERE ticket_number LIKE 'EVO-' || today_str || '-%';
  
  ticket := 'EVO-' || today_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN ticket;
END;
$$;

-- Function for proportional expert assignment (lowest open ticket count)
CREATE OR REPLACE FUNCTION public.assign_expert_proportional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expert_id UUID;
  expert_name TEXT;
BEGIN
  -- Generate ticket number
  NEW.ticket_number := public.generate_ticket_number();
  
  -- Find admin with fewest open (non-archived, non-completed) requests
  SELECT ur.user_id INTO expert_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  ORDER BY (
    SELECT COUNT(*) FROM public.legal_requests lr
    WHERE lr.assigned_to = ur.user_id
      AND lr.status IN ('pending', 'reviewing')
  ) ASC, random()
  LIMIT 1;
  
  IF expert_id IS NOT NULL THEN
    -- Get expert name from profiles
    SELECT COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), 'EvoLegal Expert')
    INTO expert_name
    FROM public.profiles p
    WHERE p.id = expert_id;
    
    NEW.assigned_to := expert_id;
    NEW.assigned_to_name := COALESCE(expert_name, 'EvoLegal Expert');
    NEW.assigned_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment on insert
DROP TRIGGER IF EXISTS trg_auto_assign_request ON public.legal_requests;
CREATE TRIGGER trg_auto_assign_request
  BEFORE INSERT ON public.legal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_expert_proportional();

-- Backfill existing requests without ticket numbers
DO $$
DECLARE
  r RECORD;
  day_str TEXT;
  seq INT;
BEGIN
  FOR r IN SELECT id, created_at FROM public.legal_requests WHERE ticket_number IS NULL ORDER BY created_at ASC
  LOOP
    day_str := to_char(r.created_at, 'YYYYMMDD');
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(ticket_number FROM 'EVO-\d{8}-(\d+)') AS INT)
    ), 0) + 1
    INTO seq
    FROM public.legal_requests
    WHERE ticket_number LIKE 'EVO-' || day_str || '-%';
    
    UPDATE public.legal_requests
    SET ticket_number = 'EVO-' || day_str || '-' || LPAD(seq::TEXT, 5, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;
