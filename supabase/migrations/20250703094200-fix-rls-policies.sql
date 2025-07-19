
-- Re-enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage their own customers" ON customers;
DROP POLICY IF EXISTS "Users can manage their own visits" ON visits;
DROP POLICY IF EXISTS "Users can manage their own requirements" ON requirements;

-- Create simplified policies that work without the custom function
-- Since we're using Clerk, we'll create policies that allow all authenticated users for now
-- This can be refined later when proper Clerk integration is implemented

CREATE POLICY "Allow authenticated users to manage companies" 
ON companies 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage customers" 
ON customers 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage visits" 
ON visits 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage requirements" 
ON requirements 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop the custom function that was causing issues
DROP FUNCTION IF EXISTS get_clerk_user_id();
