-- Add user_id columns to all tables for proper data isolation
ALTER TABLE public.companies ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.visits ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.requirements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing data to assign to the first user (temporary fix)
-- In production, you'd need to handle this more carefully
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE public.companies SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.customers SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.visits SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.requirements SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL after updating existing data
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