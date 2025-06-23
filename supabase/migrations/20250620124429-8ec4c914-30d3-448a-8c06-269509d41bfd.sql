
-- Update the process_daily_profits function to create transactions and notifications
CREATE OR REPLACE FUNCTION public.process_daily_profits()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  investment_record RECORD;
  profit_amount NUMERIC;
  processed_count INTEGER := 0;
BEGIN
  -- Loop through all active investments that haven't received today's profit
  FOR investment_record IN
    SELECT ui.*, ip.daily_profit_percentage
    FROM public.user_investments ui
    JOIN public.investment_plans ip ON ui.investment_plan_id = ip.id
    WHERE ui.status = 'active'
      AND ui.end_date > CURRENT_DATE
      AND (ui.last_profit_date IS NULL OR ui.last_profit_date < CURRENT_DATE)
      AND ui.start_date::date <= CURRENT_DATE
  LOOP
    -- Calculate daily profit
    profit_amount := investment_record.amount * investment_record.daily_profit_percentage;
    
    -- Insert daily profit record
    INSERT INTO public.daily_profits (
      user_investment_id,
      user_id,
      profit_amount,
      profit_date,
      status
    ) VALUES (
      investment_record.id,
      investment_record.user_id,
      profit_amount,
      CURRENT_DATE,
      'processed'
    ) ON CONFLICT (user_investment_id, profit_date) DO NOTHING;
    
    -- Update user balance
    UPDATE public.users 
    SET available_balance = available_balance + profit_amount,
        updated_at = now()
    WHERE id = investment_record.user_id;
    
    -- Create transaction record for the profit
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      status,
      reference_type,
      reference_id,
      description
    ) VALUES (
      investment_record.user_id,
      'profit',
      profit_amount,
      'completed',
      'daily_profit',
      investment_record.id,
      'Daily profit from investment - Rs. ' || profit_amount
    );
    
    -- Update investment record
    UPDATE public.user_investments
    SET total_profit_earned = total_profit_earned + profit_amount,
        last_profit_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = investment_record.id;
    
    -- Create notification for user
    PERFORM public.create_user_activity_notification(
      investment_record.user_id,
      'profit',
      'Daily Profit Credited',
      'Your daily profit of Rs. ' || profit_amount || ' has been credited to your account.',
      '💰',
      'normal',
      jsonb_build_object('investment_id', investment_record.id, 'profit_amount', profit_amount)
    );
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$function$;

-- Update transactions table constraint to include 'profit' type
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'commission', 'referral_bonus', 'game', 'investment', 'profit'));
