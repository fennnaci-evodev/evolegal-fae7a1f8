ALTER TABLE public.hugo_knowledge_sources
  ADD COLUMN content_hash text,
  ADD COLUMN monitored_text text,
  ADD COLUMN unapplied_effects integer,
  ADD COLUMN last_checked_at timestamptz,
  ADD COLUMN check_status text NOT NULL DEFAULT 'unchecked';

CREATE TABLE public.hugo_source_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.hugo_knowledge_sources(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  change_kind text NOT NULL,
  previous_hash text,
  new_hash text,
  previous_unapplied integer,
  new_unapplied integer,
  impact_analysis text,
  analysis_status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz
);
GRANT SELECT, UPDATE ON public.hugo_source_changes TO authenticated;
GRANT ALL ON public.hugo_source_changes TO service_role;
ALTER TABLE public.hugo_source_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators review source changes" ON public.hugo_source_changes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX hugo_source_changes_source ON public.hugo_source_changes (source_id, detected_at DESC);

INSERT INTO public.hugo_knowledge_sources (title, source_url, jurisdiction, topic, excerpt, effective_from) VALUES
('Unfair Contract Terms Act 1977, s 2', 'https://www.legislation.gov.uk/ukpga/1977/50/section/2', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1978-02-01'),
('Unfair Contract Terms Act 1977, s 3', 'https://www.legislation.gov.uk/ukpga/1977/50/section/3', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1978-02-01'),
('Unfair Contract Terms Act 1977, s 11', 'https://www.legislation.gov.uk/ukpga/1977/50/section/11', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1978-02-01'),
('Misrepresentation Act 1967, s 3', 'https://www.legislation.gov.uk/ukpga/1967/7/section/3', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1967-04-22'),
('Contracts (Rights of Third Parties) Act 1999, s 1', 'https://www.legislation.gov.uk/ukpga/1999/31/section/1', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1999-11-11'),
('Limitation Act 1980, s 5', 'https://www.legislation.gov.uk/ukpga/1980/58/section/5', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1981-05-01'),
('Late Payment of Commercial Debts (Interest) Act 1998, Part I', 'https://www.legislation.gov.uk/ukpga/1998/20/part/I', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '1998-11-01'),
('Cavendish Square Holding BV v Makdessi; ParkingEye Ltd v Beavis [2015] UKSC 67', 'https://caselaw.nationalarchives.gov.uk/uksc/2015/67', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '2015-11-04'),
('Rock Advertising Ltd v MWB Business Exchange Centres Ltd [2018] UKSC 24', 'https://caselaw.nationalarchives.gov.uk/uksc/2018/24', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '2018-05-16'),
('Wood v Capita Insurance Services Ltd [2017] UKSC 24', 'https://caselaw.nationalarchives.gov.uk/uksc/2017/24', 'England', 'contract', 'Pending reviewer excerpt selection from the official text.', '2017-03-29');