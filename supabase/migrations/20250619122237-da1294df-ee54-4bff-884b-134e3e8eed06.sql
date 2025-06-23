
-- Create payment gateways table
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'deposit' or 'withdraw'
  gateway_type TEXT NOT NULL, -- 'paypal', 'stripe', 'bank', 'crypto', etc.
  is_active BOOLEAN DEFAULT true,
  fees_percentage DECIMAL(5,2) DEFAULT 0.00,
  fees_fixed DECIMAL(10,2) DEFAULT 0.00,
  minimum_amount DECIMAL(15,2) DEFAULT 0.00,
  maximum_amount DECIMAL(15,2),
  configuration JSONB, -- Store gateway-specific config like API keys, endpoints
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  category TEXT DEFAULT 'general', -- 'general', 'transaction', 'notification', 'security'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default payment gateways
INSERT INTO public.payment_gateways (name, type, gateway_type, is_active, fees_percentage, minimum_amount, maximum_amount) VALUES
('PayPal Deposits', 'deposit', 'paypal', true, 2.9, 10.00, 10000.00),
('Stripe Deposits', 'deposit', 'stripe', true, 2.4, 5.00, 50000.00),
('Bank Transfer Deposits', 'deposit', 'bank', true, 0.0, 100.00, 100000.00),
('Crypto Deposits', 'deposit', 'crypto', false, 1.0, 20.00, 25000.00),
('Bank Transfer Withdrawals', 'withdraw', 'bank', true, 2.5, 50.00, 50000.00),
('PayPal Withdrawals', 'withdraw', 'paypal', true, 3.5, 25.00, 5000.00),
('Crypto Withdrawals', 'withdraw', 'crypto', false, 1.5, 30.00, 10000.00);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('site_name', 'Financial App', 'string', 'general', 'Application name'),
('site_description', 'Your trusted financial partner', 'string', 'general', 'Site description'),
('support_email', 'support@example.com', 'string', 'general', 'Support email address'),
('admin_email', 'admin@example.com', 'string', 'general', 'Admin email address'),
('phone_number', '+1 234 567 8900', 'string', 'general', 'Contact phone number'),
('address', '123 Finance Street, City, Country', 'string', 'general', 'Company address'),
('maintenance_mode', 'false', 'boolean', 'general', 'Put site in maintenance mode'),
('registration_enabled', 'true', 'boolean', 'general', 'Allow new user registrations'),
('email_verification', 'true', 'boolean', 'general', 'Require email verification'),
('sms_verification', 'false', 'boolean', 'general', 'Enable SMS verification'),
('referral_system', 'true', 'boolean', 'general', 'Enable referral system'),
('default_currency', 'USD', 'string', 'general', 'Default currency'),
('timezone', 'UTC', 'string', 'general', 'System timezone'),
('date_format', 'MM/DD/YYYY', 'string', 'general', 'Date format'),
('terms_of_service', '', 'string', 'general', 'Terms of service content'),
('privacy_policy', '', 'string', 'general', 'Privacy policy content'),
('about_us', '', 'string', 'general', 'About us content'),
('minimum_deposit', '50.00', 'number', 'transaction', 'Minimum deposit amount'),
('maximum_deposit', '100000.00', 'number', 'transaction', 'Maximum deposit amount'),
('minimum_withdrawal', '100.00', 'number', 'transaction', 'Minimum withdrawal amount'),
('withdrawal_fee_percentage', '2.5', 'number', 'transaction', 'Withdrawal fee percentage'),
('auto_approve_deposits', 'false', 'boolean', 'transaction', 'Auto-approve small deposits'),
('auto_approve_limit', '1000.00', 'number', 'transaction', 'Auto-approve deposit limit');

-- Create indexes for better performance
CREATE INDEX idx_payment_gateways_type ON public.payment_gateways(type);
CREATE INDEX idx_payment_gateways_gateway_type ON public.payment_gateways(gateway_type);
CREATE INDEX idx_payment_gateways_active ON public.payment_gateways(is_active);
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- Enable RLS for security
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (you'll need to implement proper admin role checking)
CREATE POLICY "Admin can manage payment gateways" 
  ON public.payment_gateways 
  FOR ALL 
  USING (true);

CREATE POLICY "Admin can manage system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (true);
