
-- Add a new column to track if a notification is a broadcast (shows to all users)
ALTER TABLE public.notifications 
ADD COLUMN is_broadcast BOOLEAN DEFAULT FALSE;

-- Add a table to track which users have read broadcast notifications
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Enable RLS for the new table
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Create policy for user notification reads
CREATE POLICY "Users can manage their own notification reads" 
  ON public.user_notification_reads 
  FOR ALL 
  USING (true);

-- Update the create_user_notification function to handle broadcasts
CREATE OR REPLACE FUNCTION public.create_broadcast_notification(
  p_admin_id uuid, 
  p_type text, 
  p_title text, 
  p_message text, 
  p_icon text DEFAULT '📢'::text, 
  p_priority text DEFAULT 'normal'::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Insert a single broadcast notification
  INSERT INTO public.notifications (
    admin_id, type, title, message, icon, priority, metadata, is_broadcast
  ) VALUES (
    p_admin_id, p_type, p_title, p_message, p_icon, p_priority, p_metadata, TRUE
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Update mark_notification_read function to handle broadcasts
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_broadcast_notification BOOLEAN;
  current_user_id UUID;
BEGIN
  -- Get current user ID (for regular users, not admin)
  current_user_id := auth.uid()::uuid;
  
  -- Check if this is a broadcast notification
  SELECT is_broadcast INTO is_broadcast_notification 
  FROM public.notifications 
  WHERE id = notification_id;
  
  IF is_broadcast_notification THEN
    -- For broadcast notifications, record that this user has read it
    INSERT INTO public.user_notification_reads (user_id, notification_id)
    VALUES (current_user_id, notification_id)
    ON CONFLICT (user_id, notification_id) DO NOTHING;
  ELSE
    -- For regular notifications, mark as read
    UPDATE public.notifications 
    SET is_read = true, updated_at = now()
    WHERE id = notification_id 
      AND user_id = current_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to check if user has read a broadcast notification
CREATE OR REPLACE FUNCTION public.user_has_read_broadcast(p_user_id uuid, p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_notification_reads 
    WHERE user_id = p_user_id AND notification_id = p_notification_id
  );
END;
$$;
