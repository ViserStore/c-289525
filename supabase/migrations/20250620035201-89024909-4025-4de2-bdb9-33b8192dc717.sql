
-- Create notifications_user table for user activities
CREATE TABLE public.notifications_user (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications_user table
ALTER TABLE public.notifications_user ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications_user
CREATE POLICY "Users can view their own user notifications" 
  ON public.notifications_user 
  FOR SELECT 
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "System can insert user notifications" 
  ON public.notifications_user 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own user notifications" 
  ON public.notifications_user 
  FOR UPDATE 
  USING (auth.uid()::uuid = user_id);

-- Function to create user activity notifications
CREATE OR REPLACE FUNCTION public.create_user_activity_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_icon text DEFAULT '📢',
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications_user (
    user_id, type, title, message, icon, priority, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_icon, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark user notification as read
CREATE OR REPLACE FUNCTION public.mark_user_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications_user 
  SET is_read = true, updated_at = now()
  WHERE id = notification_id 
    AND user_id = auth.uid()::uuid;
  
  RETURN TRUE;
END;
$$;

-- Function to clear/delete user notification
CREATE OR REPLACE FUNCTION public.clear_user_notification(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications_user 
  WHERE id = notification_id 
    AND user_id = auth.uid()::uuid;
  
  RETURN TRUE;
END;
$$;
