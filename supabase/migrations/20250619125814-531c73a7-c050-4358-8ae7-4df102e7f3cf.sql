
-- Create deposits table
CREATE TABLE public.deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL,
  transaction_id text,
  bank_details text,
  screenshot_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  processed_by uuid REFERENCES public.users(id),
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'commission', 'referral_bonus')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_type text, -- 'deposit', 'withdrawal', etc.
  reference_id uuid, -- ID from deposits, withdrawals, etc.
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add ImageKit settings to system_settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('imagekit_id', '', 'string', 'imagekit', 'ImageKit ID for image storage'),
('imagekit_public_key', '', 'string', 'imagekit', 'ImageKit public key'),
('imagekit_private_key', '', 'string', 'imagekit', 'ImageKit private key'),
('imagekit_url_endpoint', '', 'string', 'imagekit', 'ImageKit URL endpoint');

-- Enable RLS on new tables
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposits
CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));

CREATE POLICY "Users can create their own deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own deposits" ON public.deposits
  FOR UPDATE USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND username = 'admin'
  ));

CREATE POLICY "System can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_reference ON public.transactions(reference_type, reference_id);
