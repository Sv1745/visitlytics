
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage visits" ON visits;
DROP POLICY IF EXISTS "Allow authenticated users to manage requirements" ON requirements;

-- Create a function to get the current Clerk user ID from the session
CREATE OR REPLACE FUNCTION get_current_clerk_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    jwt_payload jsonb;
    user_id text;
BEGIN
    -- Get the JWT payload from the current session
    SELECT auth.jwt() INTO jwt_payload;
    
    -- Extract the user_id from the JWT payload
    -- Clerk stores the user ID in the 'sub' claim
    user_id := jwt_payload->>'sub';
    
    -- If no user_id found, return null
    IF user_id IS NULL OR user_id = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN user_id;
END;
$$;

-- Create proper RLS policies that filter by Clerk user ID
CREATE POLICY "Users can only manage their own companies" 
ON companies 
FOR ALL 
TO authenticated
USING (user_id = get_current_clerk_user_id())
WITH CHECK (user_id = get_current_clerk_user_id());

CREATE POLICY "Users can only manage their own customers" 
ON customers 
FOR ALL 
TO authenticated
USING (user_id = get_current_clerk_user_id())
WITH CHECK (user_id = get_current_clerk_user_id());

CREATE POLICY "Users can only manage their own visits" 
ON visits 
FOR ALL 
TO authenticated
USING (user_id = get_current_clerk_user_id())
WITH CHECK (user_id = get_current_clerk_user_id());

CREATE POLICY "Users can only manage their own requirements" 
ON requirements 
FOR ALL 
TO authenticated
USING (user_id = get_current_clerk_user_id())
WITH CHECK (user_id = get_current_clerk_user_id());
