-- Update user_id columns to accept TEXT instead of UUID to work with Clerk
ALTER TABLE companies ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE customers ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE visits ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE requirements ALTER COLUMN user_id TYPE TEXT;

-- Update RLS policies to work with Clerk string user IDs
-- Note: We need to cast auth.uid() to text since Clerk user IDs are strings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage their own customers" ON customers;
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Users can manage their own requirements" ON requirements;

-- Create new policies that work with Clerk text user IDs
CREATE POLICY "Users can manage their own companies" 
ON companies 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own customers" 
ON customers 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own visits" 
ON visits 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own requirements" 
ON requirements 
FOR ALL 
USING (auth.uid()::text = user_id);