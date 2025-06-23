
-- Enable RLS on user_investments table (if not already enabled)
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view their own investments" ON public.user_investments;
DROP POLICY IF EXISTS "System can create investments" ON public.user_investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.user_investments;
DROP POLICY IF EXISTS "Admin can delete investments" ON public.user_investments;

-- Create policy that allows users to view their own investments
CREATE POLICY "Users can view their own investments" 
  ON public.user_investments 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));

-- Create policy that allows authenticated users to create investments
CREATE POLICY "System can create investments" 
  ON public.user_investments 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows users to update their own investments
CREATE POLICY "Users can update their own investments" 
  ON public.user_investments 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));

-- Create policy that allows admin to delete investments
CREATE POLICY "Admin can delete investments" 
  ON public.user_investments 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));
