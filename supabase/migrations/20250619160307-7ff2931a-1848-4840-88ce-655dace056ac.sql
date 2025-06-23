
-- Add bind_status column to users table
ALTER TABLE public.users 
ADD COLUMN bind_status INTEGER DEFAULT 0;

-- Add comment to explain the bind_status values
COMMENT ON COLUMN public.users.bind_status IS '0 = not bound, 1 = bound - indicates if user has bound their withdrawal account details';

-- Create withdrawals table to store withdrawal requests
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  gateway_id UUID REFERENCES public.payment_gateways(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  withdrawal_method TEXT NOT NULL,
  account_details JSONB,
  screenshot_url TEXT,
  admin_notes TEXT,
  transaction_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for withdrawals table
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policy for withdrawals
CREATE POLICY "Users can view their own withdrawals" 
  ON public.withdrawals 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own withdrawals" 
  ON public.withdrawals 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admin can manage all withdrawals" 
  ON public.withdrawals 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON public.withdrawals(created_at);
