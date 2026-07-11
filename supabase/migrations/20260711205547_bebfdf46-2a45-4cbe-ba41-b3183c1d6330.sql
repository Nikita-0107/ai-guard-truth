
-- threat_metrics
CREATE TABLE public.threat_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL UNIQUE,
  metric_value text NOT NULL,
  metric_change text,
  metric_status text,
  sort_order int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.threat_metrics TO anon, authenticated;
GRANT ALL ON public.threat_metrics TO service_role;
ALTER TABLE public.threat_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read threat_metrics" ON public.threat_metrics FOR SELECT USING (true);

-- scam_trends
CREATE TABLE public.scam_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_type text NOT NULL UNIQUE,
  percentage numeric NOT NULL,
  color text,
  priority int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scam_trends TO anon, authenticated;
GRANT ALL ON public.scam_trends TO service_role;
ALTER TABLE public.scam_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read scam_trends" ON public.scam_trends FOR SELECT USING (true);

-- threat_alerts
CREATE TABLE public.threat_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text,
  scam_type text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  description text,
  timestamp timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.threat_alerts TO anon, authenticated;
GRANT ALL ON public.threat_alerts TO service_role;
ALTER TABLE public.threat_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read threat_alerts" ON public.threat_alerts FOR SELECT USING (true);

-- demo_investigations (named to avoid clashing with existing user-owned "investigations" table)
CREATE TABLE public.demo_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL DEFAULT now(),
  city text NOT NULL,
  scam_type text NOT NULL,
  risk_score int NOT NULL,
  status text NOT NULL
);
GRANT SELECT ON public.demo_investigations TO anon, authenticated;
GRANT ALL ON public.demo_investigations TO service_role;
ALTER TABLE public.demo_investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read demo_investigations" ON public.demo_investigations FOR SELECT USING (true);

-- hotspot_statistics
CREATE TABLE public.hotspot_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL UNIQUE,
  state text,
  total_cases int NOT NULL,
  critical_cases int NOT NULL,
  top_scam text,
  trend text,
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotspot_statistics TO anon, authenticated;
GRANT ALL ON public.hotspot_statistics TO service_role;
ALTER TABLE public.hotspot_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hotspot_statistics" ON public.hotspot_statistics FOR SELECT USING (true);

-- ============ SEED DATA ============

INSERT INTO public.threat_metrics (metric_name, metric_value, metric_change, metric_status, sort_order) VALUES
  ('Investigations Today', '2,847', '+18%', 'up', 1),
  ('High Risk Alerts', '326', '+12%', 'up', 2),
  ('Digital Arrest Scams', '142', 'Trending Up', 'up', 3),
  ('Estimated Money Saved', '₹18.4 Lakh', 'Demo Data', 'info', 4)
ON CONFLICT (metric_name) DO NOTHING;

INSERT INTO public.scam_trends (scam_type, percentage, color, priority) VALUES
  ('Digital Arrest', 42, 'from-rose-500 to-orange-500', 1),
  ('Investment Fraud', 24, 'from-fuchsia-500 to-violet-500', 2),
  ('UPI Scam', 16, 'from-cyan-400 to-blue-500', 3),
  ('Courier Scam', 11, 'from-amber-400 to-orange-500', 4),
  ('Job Scam', 7, 'from-emerald-400 to-teal-500', 5)
ON CONFLICT (scam_type) DO NOTHING;

INSERT INTO public.threat_alerts (city, state, scam_type, severity, title, description, timestamp) VALUES
  ('Delhi', 'Delhi', 'Digital Arrest', 'critical', 'Digital Arrest campaign targeting senior citizens.', 'Fake CBI/police video calls demanding immediate transfers.', now() - interval '12 minutes'),
  ('Mumbai', 'Maharashtra', 'Investment Scam', 'high', 'Investment scam using fake trading groups.', 'WhatsApp groups promising 30% weekly returns.', now() - interval '38 minutes'),
  ('Bengaluru', 'Karnataka', 'Courier Scam', 'high', 'Courier scam impersonating customs officials.', 'Callers claim seized packages with drugs.', now() - interval '1 hour'),
  ('Hyderabad', 'Telangana', 'KYC Scam', 'medium', 'Fake KYC update links detected.', 'SMS with shortened URLs to phishing forms.', now() - interval '2 hours'),
  ('Pune', 'Maharashtra', 'UPI Scam', 'high', 'UPI Collect Request Fraud.', 'Fake buyers sending collect requests as payments.', now() - interval '3 hours'),
  ('Ahmedabad', 'Gujarat', 'Lottery Scam', 'medium', 'Prize claim fraud detected.', 'Users asked to pay processing fees to claim prizes.', now() - interval '5 hours');

INSERT INTO public.demo_investigations (date, city, scam_type, risk_score, status) VALUES
  (now() - interval '2 hours',  'Delhi',      'Digital Arrest',   96, 'Reported'),
  (now() - interval '5 hours',  'Mumbai',     'Investment Fraud', 88, 'Under Review'),
  (now() - interval '8 hours',  'Bengaluru',  'UPI Scam',         82, 'Resolved'),
  (now() - interval '1 day',    'Hyderabad',  'Courier Scam',     54, 'Resolved'),
  (now() - interval '1 day',    'Pune',       'Job Scam',         28, 'Archived'),
  (now() - interval '2 days',   'Chennai',    'KYC Scam',         71, 'Under Review'),
  (now() - interval '2 days',   'Jaipur',     'Lottery Scam',     46, 'Archived'),
  (now() - interval '3 days',   'Kolkata',    'Digital Arrest',   93, 'Reported'),
  (now() - interval '3 days',   'Lucknow',    'Investment Fraud', 78, 'Under Review'),
  (now() - interval '4 days',   'Ahmedabad',  'UPI Scam',         64, 'Resolved'),
  (now() - interval '4 days',   'Delhi',      'Courier Scam',     58, 'Resolved'),
  (now() - interval '5 days',   'Mumbai',     'Job Scam',         14, 'Archived'),
  (now() - interval '5 days',   'Bengaluru',  'Digital Arrest',   91, 'Reported'),
  (now() - interval '6 days',   'Pune',       'Investment Fraud', 84, 'Under Review'),
  (now() - interval '6 days',   'Hyderabad',  'UPI Scam',         49, 'Resolved'),
  (now() - interval '7 days',   'Chennai',    'KYC Scam',         66, 'Resolved'),
  (now() - interval '8 days',   'Jaipur',     'Digital Arrest',   89, 'Under Review'),
  (now() - interval '9 days',   'Lucknow',    'Lottery Scam',     22, 'Archived'),
  (now() - interval '10 days',  'Kolkata',    'Courier Scam',     61, 'Resolved'),
  (now() - interval '11 days',  'Ahmedabad',  'Investment Fraud', 76, 'Under Review'),
  (now() - interval '12 days',  'Delhi',      'UPI Scam',         55, 'Resolved'),
  (now() - interval '13 days',  'Mumbai',     'Digital Arrest',   94, 'Reported');

INSERT INTO public.hotspot_statistics (city, state, total_cases, critical_cases, top_scam, trend) VALUES
  ('Delhi',     'Delhi',        482, 118, 'Digital Arrest',   'up'),
  ('Mumbai',    'Maharashtra',  431,  96, 'Investment Fraud', 'up'),
  ('Bengaluru', 'Karnataka',    388,  74, 'UPI Scam',         'up'),
  ('Hyderabad', 'Telangana',    312,  58, 'Courier Scam',     'flat'),
  ('Chennai',   'Tamil Nadu',   276,  49, 'KYC Scam',         'flat'),
  ('Pune',      'Maharashtra',  254,  41, 'Job Scam',         'up'),
  ('Jaipur',    'Rajasthan',    198,  33, 'Lottery Scam',     'flat'),
  ('Lucknow',   'Uttar Pradesh',176,  29, 'Digital Arrest',   'up'),
  ('Kolkata',   'West Bengal',  221,  44, 'Courier Scam',     'flat'),
  ('Ahmedabad', 'Gujarat',      204,  36, 'Investment Fraud', 'up')
ON CONFLICT (city) DO NOTHING;
