
-- Drop existing RLS policies for notifications_user table
DROP POLICY IF EXISTS "Users can view their own user notifications" ON public.notifications_user;
DROP POLICY IF EXISTS "System can insert user notifications" ON public.notifications_user;
DROP POLICY IF EXISTS "Users can update their own user notifications" ON public.notifications_user;

-- Disable RLS temporarily to allow access with custom auth
ALTER TABLE public.notifications_user DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create more permissive policies that work with custom auth
-- Re-enable RLS
ALTER TABLE public.notifications_user ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow access for authenticated users
CREATE POLICY "Allow all authenticated users to view user notifications" 
  ON public.notifications_user 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all to insert user notifications" 
  ON public.notifications_user 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update user notifications" 
  ON public.notifications_user 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all authenticated users to delete user notifications" 
  ON public.notifications_user 
  FOR DELETE 
  USING (true);
