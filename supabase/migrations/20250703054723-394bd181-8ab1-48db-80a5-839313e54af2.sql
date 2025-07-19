-- Add user_id columns as nullable first
ALTER TABLE public.companies ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.visits ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.requirements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Delete existing data since we can't properly assign it to users
-- This is the cleanest approach for development
DELETE FROM public.visits;
DELETE FROM public.requirements;
DELETE FROM public.customers;
DELETE FROM public.companies;

-- Now make user_id NOT NULL
ALTER TABLE public.companies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.visits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.requirements ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to properly isolate data per user
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.visits;
DROP POLICY IF EXISTS "Allow full access to requirements" ON public.requirements;

-- Create proper user-isolated RLS policies
CREATE POLICY "Users can manage their own companies" ON public.companies
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own customers" ON public.customers
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own visits" ON public.visits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own requirements" ON public.requirements
    FOR ALL USING (auth.uid() = user_id);