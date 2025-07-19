
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

-- Since we can't use Clerk auth directly with Supabase RLS,
-- we'll create policies that allow authenticated users to access all data
-- This is a temporary solution until proper Clerk integration is implemented

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage visits" ON visits;
DROP POLICY IF EXISTS "Allow authenticated users to manage requirements" ON requirements;

-- Create new policies that allow authenticated users to manage all data
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
