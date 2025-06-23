
-- Update the activity notifications function to store user activity in notifications_user table
CREATE OR REPLACE FUNCTION public.create_activity_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  user_name TEXT;
  admin_ids UUID[];
BEGIN
  -- Get user name for notifications
  SELECT full_name INTO user_name FROM public.users WHERE id = NEW.user_id;
  
  -- Get all active admin IDs
  SELECT ARRAY(SELECT id FROM public.admin_users WHERE is_active = true) INTO admin_ids;
  
  -- Handle different table triggers
  IF TG_TABLE_NAME = 'deposits' THEN
    -- Create user notification for deposit in notifications_user table
    PERFORM public.create_user_activity_notification(
      NEW.user_id,
      'deposit',
      CASE 
        WHEN NEW.status = 'approved' THEN 'Deposit Approved'
        WHEN NEW.status = 'pending' THEN 'Deposit Submitted'
        WHEN NEW.status = 'rejected' THEN 'Deposit Rejected'
        ELSE 'Deposit Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your deposit of Rs. ' || NEW.amount || ' has been approved and added to your account.'
        WHEN NEW.status = 'pending' THEN 'Your deposit request of Rs. ' || NEW.amount || ' has been submitted and is being processed.'
        WHEN NEW.status = 'rejected' THEN 'Your deposit request of Rs. ' || NEW.amount || ' has been rejected. Please contact support for assistance.'
        ELSE 'Your deposit status has been updated to ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'approved' THEN '💳'
        WHEN 'pending' THEN '⏳'
        WHEN 'rejected' THEN '❌'
        ELSE '💰'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'high'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END,
      jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
    
    -- Create admin notifications for new deposits in notifications table (broadcast)
    IF NEW.status = 'pending' THEN
      FOR i IN 1..array_length(admin_ids, 1) LOOP
        PERFORM public.create_admin_notification(
          admin_ids[i],
          'deposit',
          'New Deposit Request',
          user_name || ' has submitted a deposit request of Rs. ' || NEW.amount || ' via ' || NEW.payment_method,
          '💳',
          'normal',
          jsonb_build_object('deposit_id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount)
        );
      END LOOP;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'withdrawals' THEN
    -- Create user notification for withdrawal in notifications_user table
    PERFORM public.create_user_activity_notification(
      NEW.user_id,
      'withdrawal',
      CASE 
        WHEN NEW.status = 'completed' THEN 'Withdrawal Completed'
        WHEN NEW.status = 'pending' THEN 'Withdrawal Submitted'
        WHEN NEW.status = 'rejected' THEN 'Withdrawal Rejected'
        ELSE 'Withdrawal Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Your withdrawal of Rs. ' || NEW.amount || ' has been successfully processed.'
        WHEN NEW.status = 'pending' THEN 'Your withdrawal request of Rs. ' || NEW.amount || ' has been submitted and is being processed.'
        WHEN NEW.status = 'rejected' THEN 'Your withdrawal request of Rs. ' || NEW.amount || ' has been rejected. Please contact support for assistance.'
        ELSE 'Your withdrawal status has been updated to ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'completed' THEN '💸'
        WHEN 'pending' THEN '⏳'
        WHEN 'rejected' THEN '❌'
        ELSE '💰'
      END,
      CASE NEW.status
        WHEN 'completed' THEN 'high'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END,
      jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
    
    -- Create admin notifications for new withdrawals in notifications table (broadcast)
    IF NEW.status = 'pending' THEN
      FOR i IN 1..array_length(admin_ids, 1) LOOP
        PERFORM public.create_admin_notification(
          admin_ids[i],
          'withdrawal',
          'New Withdrawal Request',
          user_name || ' has submitted a withdrawal request of Rs. ' || NEW.amount || ' via ' || NEW.withdrawal_method,
          '💸',
          'normal',
          jsonb_build_object('withdrawal_id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount)
        );
      END LOOP;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'transactions' AND NEW.type = 'investment' THEN
    -- Create user notification for investment in notifications_user table
    PERFORM public.create_user_activity_notification(
      NEW.user_id,
      'investment',
      CASE 
        WHEN NEW.status = 'completed' THEN 'Investment Successful'
        WHEN NEW.status = 'pending' THEN 'Investment Processing'
        WHEN NEW.status = 'failed' THEN 'Investment Failed'
        ELSE 'Investment Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Your investment of Rs. ' || NEW.amount || ' has been successfully activated and will start generating returns.'
        WHEN NEW.status = 'pending' THEN 'Your investment of Rs. ' || NEW.amount || ' is being processed.'
        WHEN NEW.status = 'failed' THEN 'Your investment of Rs. ' || NEW.amount || ' could not be processed. Your balance has been refunded.'
        ELSE 'Your investment status has been updated to ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'completed' THEN '🎯'
        WHEN 'pending' THEN '⏳'
        WHEN 'failed' THEN '❌'
        ELSE '💰'
      END,
      CASE NEW.status
        WHEN 'completed' THEN 'high'
        WHEN 'failed' THEN 'high'
        ELSE 'normal'
      END,
      jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
    
    -- Create admin notifications for new investments in notifications table (broadcast)
    IF NEW.status = 'completed' THEN
      FOR i IN 1..array_length(admin_ids, 1) LOOP
        PERFORM public.create_admin_notification(
          admin_ids[i],
          'investment',
          'New Investment',
          user_name || ' has made a new investment of Rs. ' || NEW.amount,
          '🎯',
          'normal',
          jsonb_build_object('transaction_id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount)
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for activity notifications if they don't exist
DROP TRIGGER IF EXISTS deposits_activity_trigger ON public.deposits;
CREATE TRIGGER deposits_activity_trigger
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.create_activity_notifications();

DROP TRIGGER IF EXISTS withdrawals_activity_trigger ON public.withdrawals;
CREATE TRIGGER withdrawals_activity_trigger
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_activity_notifications();

DROP TRIGGER IF EXISTS transactions_activity_trigger ON public.transactions;
CREATE TRIGGER transactions_activity_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_activity_notifications();
