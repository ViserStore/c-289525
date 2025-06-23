
-- Update the transactions table check constraint to include 'signup_bonus' type
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the updated constraint that includes 'signup_bonus' type
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'commission', 'referral_bonus', 'game', 'referral_commission', 'profit', 'signup_bonus', 'investment'));
