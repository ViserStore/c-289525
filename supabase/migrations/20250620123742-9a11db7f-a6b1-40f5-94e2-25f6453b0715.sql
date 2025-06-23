
-- Create the daily_profits table to store daily profit records
CREATE TABLE public.daily_profits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  profit_amount NUMERIC NOT NULL DEFAULT 0.00,
  profit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Create unique constraint to prevent duplicate profits for same investment on same date
  UNIQUE(user_investment_id, profit_date)
);

-- Add foreign key relationships
ALTER TABLE public.daily_profits 
ADD CONSTRAINT fk_daily_profits_user_investment 
FOREIGN KEY (user_investment_id) REFERENCES public.user_investments(id) ON DELETE CASCADE;

ALTER TABLE public.daily_profits 
ADD CONSTRAINT fk_daily_profits_user 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_daily_profits_user_id ON public.daily_profits(user_id);
CREATE INDEX idx_daily_profits_user_investment_id ON public.daily_profits(user_investment_id);
CREATE INDEX idx_daily_profits_profit_date ON public.daily_profits(profit_date);
CREATE INDEX idx_daily_profits_status ON public.daily_profits(status);

-- Enable Row Level Security (optional - add policies if needed)
ALTER TABLE public.daily_profits ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own daily profits
CREATE POLICY "Users can view their own daily profits" 
ON public.daily_profits 
FOR SELECT 
USING (user_id = auth.uid()::uuid);
