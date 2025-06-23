
-- Create notifications table for storing all notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'admin', 'system', 'welcome', 'security')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraint to ensure either user_id or admin_id is set, but not both
  CONSTRAINT notification_recipient_check CHECK (
    (user_id IS NOT NULL AND admin_id IS NULL) OR 
    (user_id IS NULL AND admin_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for users - they can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (user_id IS NOT NULL AND user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (user_id IS NOT NULL AND user_id = auth.uid()::uuid);

-- RLS policies for admin users - they can see admin notifications
CREATE POLICY "Admin users can view admin notifications" 
  ON public.notifications 
  FOR ALL
  USING (admin_id IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_admin_id ON public.notifications(admin_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Function to create user notification
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT '📢',
  p_priority TEXT DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, icon, priority, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_icon, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to create admin notification
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_admin_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT '📢',
  p_priority TEXT DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    admin_id, type, title, message, icon, priority, metadata
  ) VALUES (
    p_admin_id, p_type, p_title, p_message, p_icon, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function to create notifications for user activities
CREATE OR REPLACE FUNCTION public.create_activity_notifications()
RETURNS TRIGGER
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
    -- Create user notification for deposit
    PERFORM public.create_user_notification(
      NEW.user_id,
      'deposit',
      CASE 
        WHEN NEW.status = 'completed' THEN 'Deposit Successful'
        WHEN NEW.status = 'pending' THEN 'Deposit Submitted'
        WHEN NEW.status = 'rejected' THEN 'Deposit Rejected'
        ELSE 'Deposit Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Your deposit of Rs. ' || NEW.amount || ' has been successfully processed and added to your account.'
        WHEN NEW.status = 'pending' THEN 'Your deposit request of Rs. ' || NEW.amount || ' has been submitted and is being processed.'
        WHEN NEW.status = 'rejected' THEN 'Your deposit request of Rs. ' || NEW.amount || ' has been rejected. Please contact support for assistance.'
        ELSE 'Your deposit status has been updated to ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'completed' THEN '💳'
        WHEN 'pending' THEN '⏳'
        WHEN 'rejected' THEN '❌'
        ELSE '💰'
      END,
      CASE NEW.status
        WHEN 'completed' THEN 'high'
        WHEN 'rejected' THEN 'high'
        ELSE 'normal'
      END,
      jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status)
    );
    
    -- Create admin notifications for new deposits
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
    
  ELSIF TG_TABLE_NAME = 'withdrawals' THEN
    -- Create user notification for withdrawal
    PERFORM public.create_user_notification(
      NEW.user_id,
      'withdrawal',
      CASE 
        WHEN NEW.status = 'completed' THEN 'Withdrawal Successful'
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
    
    -- Create admin notifications for new withdrawals
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
    
  ELSIF TG_TABLE_NAME = 'transactions' AND NEW.type = 'investment' THEN
    -- Create user notification for investment
    PERFORM public.create_user_notification(
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
    
    -- Create admin notifications for new investments
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
  
  RETURN NEW;
END;
$$;

-- Create triggers for automatic notification creation
CREATE TRIGGER trigger_deposit_notifications
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.create_activity_notifications();

CREATE TRIGGER trigger_withdrawal_notifications
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_activity_notifications();

CREATE TRIGGER trigger_investment_notifications
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.type = 'investment')
  EXECUTE FUNCTION public.create_activity_notifications();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = now()
  WHERE id = notification_id 
    AND (
      (user_id IS NOT NULL AND user_id = auth.uid()::uuid) OR
      (admin_id IS NOT NULL)
    );
  
  RETURN FOUND;
END;
$$;

-- Function to mark all user notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = now()
  WHERE is_read = false 
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_user_id IS NULL AND user_id = auth.uid()::uuid)
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
