
-- Create the increment_user_balance function
CREATE OR REPLACE FUNCTION public.increment_user_balance(user_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET 
    available_balance = COALESCE(available_balance, 0) + amount,
    total_deposits = COALESCE(total_deposits, 0) + amount,
    updated_at = now()
  WHERE id = user_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with ID % not found', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_user_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_balance(uuid, numeric) TO service_role;
