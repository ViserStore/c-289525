
-- Create user_levels table to store level configurations
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  referrals_required INTEGER NOT NULL DEFAULT 0,
  bonus_amount NUMERIC NOT NULL DEFAULT 0.00,
  benefits JSONB DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default level data
INSERT INTO public.user_levels (level, name, description, referrals_required, bonus_amount, benefits, color) VALUES
(1, 'Bronze Explorer', 'Starting level with basic features', 0, 0.00, '["Basic dashboard access", "Standard support"]'::jsonb, '#cd7f32'),
(2, 'Silver Trader', 'Enhanced features with priority support', 3, 100.00, '["Priority support", "Enhanced dashboard", "Investment tracking"]'::jsonb, '#c0c0c0'),
(3, 'Gold Investor', 'Elite status with premium benefits', 10, 500.00, '["Premium support", "Advanced analytics", "Exclusive investment plans"]'::jsonb, '#ffd700'),
(4, 'Platinum Elite', 'Ultimate membership with maximum benefits', 20, 1000.00, '["VIP support", "Personal account manager", "Exclusive rewards"]'::jsonb, '#e5e4e2'),
(5, 'Diamond Master', 'Exclusive tier for top performers', 25, 2000.00, '["Diamond support", "Custom investment plans", "Premium rewards"]'::jsonb, '#b9f2ff');

-- Add user_level column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_level') THEN
        ALTER TABLE public.users ADD COLUMN user_level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Create function to calculate and update user levels based on referrals
CREATE OR REPLACE FUNCTION public.calculate_user_level(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_count INTEGER;
  calculated_level INTEGER;
BEGIN
  -- Get referral count for the user
  SELECT COUNT(*) INTO referral_count 
  FROM public.users 
  WHERE referred_by_user_id = user_id;
  
  -- Get the highest level the user qualifies for
  SELECT level INTO calculated_level
  FROM public.user_levels
  WHERE referrals_required <= referral_count 
    AND is_active = true
  ORDER BY referrals_required DESC
  LIMIT 1;
  
  -- Default to level 1 if no level found
  IF calculated_level IS NULL THEN
    calculated_level := 1;
  END IF;
  
  -- Update user's level
  UPDATE public.users 
  SET user_level = calculated_level, updated_at = now()
  WHERE id = user_id;
  
  RETURN calculated_level;
END;
$$;

-- Create trigger to update user levels when referrals change
CREATE OR REPLACE FUNCTION public.update_referrer_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the referrer's level when a new user is referred
  IF NEW.referred_by_user_id IS NOT NULL THEN
    PERFORM public.calculate_user_level(NEW.referred_by_user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS trigger_update_referrer_level ON public.users;
CREATE TRIGGER trigger_update_referrer_level
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referrer_level();
