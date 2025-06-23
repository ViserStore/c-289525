
-- Create referral_settings table
CREATE TABLE public.referral_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default referral settings
INSERT INTO public.referral_settings (setting_key, setting_value, setting_type, description) VALUES
('referral_bonus_amount', '100.00', 'number', 'Bonus amount given to referrer when someone joins using their code'),
('referral_signup_bonus', '50.00', 'number', 'Bonus amount given to new user who signs up with referral code'),
('referral_commission_percentage', '5.00', 'number', 'Percentage commission on referral earnings'),
('referral_minimum_deposit', '500.00', 'number', 'Minimum deposit required for referral bonus to be activated'),
('referral_system_enabled', 'true', 'boolean', 'Enable or disable the referral system'),
('referral_max_levels', '3', 'number', 'Maximum levels of referral chain'),
('referral_bonus_type', 'one_time', 'string', 'Type of referral bonus: one_time or recurring');

-- Create index for faster lookups
CREATE INDEX idx_referral_settings_key ON public.referral_settings(setting_key);

-- Enable RLS
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (assuming you have admin role checking)
CREATE POLICY "Admin can manage referral settings" 
ON public.referral_settings 
FOR ALL 
USING (true); -- You might want to restrict this to admin users only

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referral_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_settings_updated_at
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_settings_updated_at();
