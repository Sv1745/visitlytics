-- First drop all existing RLS policies
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage their own customers" ON customers;
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Users can manage their own requirements" ON requirements;

-- Drop foreign key constraints that reference auth.users
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_user_id_fkey;
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_user_id_fkey;

-- Update user_id columns to accept TEXT instead of UUID to work with Clerk
ALTER TABLE companies ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE customers ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE visits ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE requirements ALTER COLUMN user_id TYPE TEXT;

-- Create new policies that work with Clerk text user IDs
-- Since we're using Clerk, we'll check against a custom function that validates the Clerk user
CREATE OR REPLACE FUNCTION get_clerk_user_id() RETURNS TEXT AS $$
BEGIN
  -- This will be set by the application layer when making requests
  RETURN current_setting('app.clerk_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can manage their own companies" 
ON companies 
FOR ALL 
USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can manage their own customers" 
ON customers 
FOR ALL 
USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can manage their own visits" 
ON visits 
FOR ALL 
USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can manage their own requirements" 
ON requirements 
FOR ALL 
USING (get_clerk_user_id() = user_id);