
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can create user account" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create new policies that allow signup functionality
-- Allow anyone to check if username/phone exists (for duplicate validation)
CREATE POLICY "Allow duplicate checks for signup" 
  ON public.users 
  FOR SELECT 
  USING (true);

-- Allow anyone to insert new users (for signup)
CREATE POLICY "Allow user registration" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

-- Only allow users to update their own data (when we implement auth later)
CREATE POLICY "Users can update own data" 
  ON public.users 
  FOR UPDATE 
  USING (false); -- Disabled for now, will enable when auth is implemented

-- Prevent deletion for security
CREATE POLICY "Prevent user deletion" 
  ON public.users 
  FOR DELETE 
  USING (false);
