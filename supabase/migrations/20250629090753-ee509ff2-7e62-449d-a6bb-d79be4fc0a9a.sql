
-- Create a table for requirements
CREATE TABLE public.requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  required_period DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for equipment types
CREATE TABLE public.equipment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default equipment types
INSERT INTO public.equipment_types (name) VALUES 
('Oven'),
('Humidity Chamber'),
('Cooling Chamber'),
('Vacuum Oven'),
('Autoclave'),
('Incubator'),
('Centrifuge'),
('Spectrophotometer');

-- Enable Row Level Security
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for requirements
CREATE POLICY "Allow full access to requirements" 
  ON public.requirements 
  FOR ALL 
  USING (true);

-- Create RLS policies for equipment_types (read-only for all)
CREATE POLICY "Allow read access to equipment_types" 
  ON public.equipment_types 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert access to equipment_types" 
  ON public.equipment_types 
  FOR INSERT 
  WITH CHECK (true);
