
-- Add the missing next_action_type column to the visits table
ALTER TABLE public.visits 
ADD COLUMN next_action_type TEXT;

-- Also add address and phone columns to companies table for Excel upload
ALTER TABLE public.companies 
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT;
