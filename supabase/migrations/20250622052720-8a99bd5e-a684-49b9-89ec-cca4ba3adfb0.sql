
-- Add missing referral settings that are used in the admin interface
INSERT INTO public.referral_settings (setting_key, setting_value, setting_type, description) VALUES
('enable_signup_bonus', 'true', 'boolean', 'Enable or disable signup bonus for new users using referral codes'),
('enable_deposit_commission', 'true', 'boolean', 'Enable or disable commission when referred user makes a deposit'),
('enable_investment_commission', 'true', 'boolean', 'Enable or disable commission when referred user makes an investment'),
('deposit_commission_percentage', '5.00', 'number', 'Commission percentage for referrer when referred user deposits'),
('investment_commission_percentage', '10.00', 'number', 'Commission percentage for referrer when referred user invests')
ON CONFLICT (setting_key) DO NOTHING;
