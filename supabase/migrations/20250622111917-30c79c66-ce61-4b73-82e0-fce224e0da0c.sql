
-- Add currency settings to system_settings if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description) 
VALUES 
  ('site_name', 'EasyPaisa', 'string', 'general', 'Website name displayed throughout the site'),
  ('default_currency_code', 'PKR', 'string', 'general', 'Default currency code (USD, PKR, INR, BDT, etc.)'),
  ('default_currency_symbol', 'Rs.', 'string', 'general', 'Default currency symbol'),
  ('supported_currencies', '{"PKR": {"symbol": "Rs.", "name": "Pakistani Rupee"}, "USD": {"symbol": "$", "name": "US Dollar"}, "INR": {"symbol": "₹", "name": "Indian Rupee"}, "BDT": {"symbol": "৳", "name": "Bangladeshi Taka"}, "EUR": {"symbol": "€", "name": "Euro"}}', 'json', 'general', 'Supported currencies with their symbols and names')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();
