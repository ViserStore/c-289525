
-- Update the process_referral_commission function to check if referral system is enabled
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  p_referred_user_id UUID,
  p_trigger_amount NUMERIC,
  p_trigger_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  referrer_record RECORD;
  commission_record RECORD;
  referral_chain UUID[];
  current_user_id UUID;
  level_counter INTEGER := 1;
  commission_amount NUMERIC;
  commission_percentage NUMERIC;
  system_enabled TEXT;
BEGIN
  -- First check if referral system is enabled
  SELECT setting_value INTO system_enabled
  FROM public.referral_settings 
  WHERE setting_key = 'referral_system_enabled';
  
  -- If referral system is disabled, exit early
  IF system_enabled IS NULL OR system_enabled != 'true' THEN
    RETURN FALSE;
  END IF;
  
  -- Get the referred user's referrer
  SELECT referred_by_user_id INTO current_user_id
  FROM public.users 
  WHERE id = p_referred_user_id;
  
  -- If no referrer, exit
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Build referral chain (up to 5 levels)
  WHILE current_user_id IS NOT NULL AND level_counter <= 5 LOOP
    referral_chain := array_append(referral_chain, current_user_id);
    
    -- Get next level referrer
    SELECT referred_by_user_id INTO current_user_id
    FROM public.users 
    WHERE id = current_user_id;
    
    level_counter := level_counter + 1;
  END LOOP;
  
  -- Process commissions for each level
  FOR i IN 1..array_length(referral_chain, 1) LOOP
    -- Get commission percentage based on level
    commission_percentage := CASE i
      WHEN 1 THEN 5.00  -- Level 1: 5%
      WHEN 2 THEN 3.00  -- Level 2: 3%
      WHEN 3 THEN 2.00  -- Level 3: 2%
      WHEN 4 THEN 1.00  -- Level 4: 1%
      WHEN 5 THEN 0.50  -- Level 5: 0.5%
      ELSE 0.00
    END;
    
    commission_amount := (p_trigger_amount * commission_percentage) / 100;
    
    IF commission_amount > 0 THEN
      -- Add commission to referrer's balance
      UPDATE public.users 
      SET available_balance = available_balance + commission_amount,
          updated_at = now()
      WHERE id = referral_chain[i];
      
      -- Record the commission
      INSERT INTO public.referral_commissions (
        referrer_user_id,
        referred_user_id,
        level,
        commission_amount,
        commission_percentage,
        trigger_type,
        trigger_amount,
        status
      ) VALUES (
        referral_chain[i],
        p_referred_user_id,
        i,
        commission_amount,
        commission_percentage,
        p_trigger_type,
        p_trigger_amount,
        'completed'
      );
      
      -- Create transaction record
      INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        status,
        description,
        reference_type,
        reference_id
      ) VALUES (
        referral_chain[i],
        'referral_commission',
        commission_amount,
        'completed',
        'Level ' || i || ' referral commission from ' || p_trigger_type || ' of Rs. ' || p_trigger_amount,
        'referral_commission',
        referral_chain[i]
      );
      
      -- Create notification
      PERFORM public.create_user_activity_notification(
        referral_chain[i],
        'referral_commission',
        'Commission Earned!',
        'You earned Rs. ' || commission_amount || ' commission from Level ' || i || ' referral ' || p_trigger_type,
        '💰',
        'high',
        jsonb_build_object(
          'commission_amount', commission_amount,
          'level', i,
          'trigger_type', p_trigger_type,
          'trigger_amount', p_trigger_amount
        )
      );
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.process_referral_commission(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_commission(UUID, NUMERIC, TEXT) TO service_role;
