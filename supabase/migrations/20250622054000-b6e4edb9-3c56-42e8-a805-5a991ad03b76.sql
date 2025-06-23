
-- Add a table to track multi-level referral commissions
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  level INTEGER NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0.00,
  commission_percentage NUMERIC NOT NULL DEFAULT 0.00,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('deposit', 'investment')),
  trigger_amount NUMERIC NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key references
  FOREIGN KEY (referrer_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions(referrer_user_id);
CREATE INDEX idx_referral_commissions_referred ON public.referral_commissions(referred_user_id);  
CREATE INDEX idx_referral_commissions_level ON public.referral_commissions(level);
CREATE INDEX idx_referral_commissions_type ON public.referral_commissions(trigger_type);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_commissions
CREATE POLICY "Users can view their referral commissions" 
ON public.referral_commissions 
FOR SELECT 
USING (referrer_user_id = auth.uid()::uuid OR referred_user_id = auth.uid()::uuid);

CREATE POLICY "Admin can manage all referral commissions" 
ON public.referral_commissions 
FOR ALL 
USING (true);
