
-- Update RLS policies for deposits table to allow proper user access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can update their own deposits" ON public.deposits;

-- Create new policies that work with the current authentication system
-- Allow users to view their own deposits (including admin access)
CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin')
  );

-- Allow authenticated users to create deposits
CREATE POLICY "Authenticated users can create deposits" ON public.deposits
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id::text
  );

-- Allow users to update their own deposits (and admin can update any)
CREATE POLICY "Users can update deposits" ON public.deposits
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin')
  );

-- Allow admin to delete deposits
CREATE POLICY "Admin can delete deposits" ON public.deposits
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin')
  );
