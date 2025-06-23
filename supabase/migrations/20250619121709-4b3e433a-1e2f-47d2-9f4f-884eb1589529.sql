
-- Add new columns to the users table for financial and account data
ALTER TABLE public.users 
ADD COLUMN available_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN bind_account_number TEXT,
ADD COLUMN bind_account_name TEXT,
ADD COLUMN bind_bank_name TEXT,
ADD COLUMN current_plan_id UUID,
ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'banned')),
ADD COLUMN kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'verified', 'rejected')),
ADD COLUMN is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN is_phone_verified BOOLEAN DEFAULT false,
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by_user_id UUID REFERENCES public.users(id),
ADD COLUMN total_deposits DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN total_withdrawals DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN profile_image_url TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN country TEXT DEFAULT 'Pakistan',
ADD COLUMN postal_code TEXT;

-- Create investment plans table
CREATE TABLE public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  minimum_amount DECIMAL(15,2) NOT NULL,
  maximum_amount DECIMAL(15,2),
  daily_profit_percentage DECIMAL(5,4) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint for current_plan_id
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_current_plan 
FOREIGN KEY (current_plan_id) REFERENCES public.investment_plans(id);

-- Create indexes for better performance
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_referred_by ON public.users(referred_by_user_id);
CREATE INDEX idx_users_account_status ON public.users(account_status);
CREATE INDEX idx_users_kyc_status ON public.users(kyc_status);

-- Insert some default investment plans
INSERT INTO public.investment_plans (name, description, minimum_amount, maximum_amount, daily_profit_percentage, duration_days) VALUES
('Bronze Plan', 'Basic investment plan for beginners', 1000.00, 10000.00, 0.0200, 30),
('Silver Plan', 'Intermediate plan with better returns', 10000.00, 50000.00, 0.0350, 45),
('Gold Plan', 'Premium plan for serious investors', 50000.00, 200000.00, 0.0500, 60),
('Diamond Plan', 'Elite plan with maximum returns', 200000.00, 1000000.00, 0.0750, 90);

-- Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = code) INTO exists_check;
    
    -- If code doesn't exist, break the loop
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Update the existing RLS policies to work with new columns
-- The existing policies should continue to work as they are
