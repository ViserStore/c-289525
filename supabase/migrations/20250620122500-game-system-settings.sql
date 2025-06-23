
-- Add game-related system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('game_enabled', 'true', 'boolean', 'game', 'Enable/disable the Rs.1 game'),
('game_cost_per_play', '1.00', 'number', 'game', 'Cost per game play in rupees'),
('game_min_prize', '2.00', 'number', 'game', 'Minimum prize amount'),
('game_max_prize', '11.00', 'number', 'game', 'Maximum prize amount'),
('game_win_rate', '40', 'number', 'game', 'Win rate percentage (0-100)'),
('game_daily_play_limit', '50', 'number', 'game', 'Maximum plays per user per day'),
('game_min_balance_required', '1.00', 'number', 'game', 'Minimum balance required to play');

-- Create game_plays table to track user game activities
CREATE TABLE IF NOT EXISTS public.game_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  prize_won DECIMAL(10,2) DEFAULT 0.00,
  is_winner BOOLEAN DEFAULT false,
  play_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_game_plays_user_id ON public.game_plays(user_id);
CREATE INDEX idx_game_plays_date ON public.game_plays(play_date);
CREATE INDEX idx_game_plays_user_date ON public.game_plays(user_id, play_date);

-- Enable RLS
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own game plays
CREATE POLICY "Users can view their own game plays" 
  ON public.game_plays 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy for users to insert their own game plays
CREATE POLICY "Users can insert their own game plays" 
  ON public.game_plays 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Admin can manage all game plays
CREATE POLICY "Admin can manage all game plays" 
  ON public.game_plays 
  FOR ALL 
  USING (true);

-- Create function to get daily play count for user
CREATE OR REPLACE FUNCTION get_user_daily_play_count(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.game_plays
    WHERE user_id = p_user_id AND play_date = p_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record game play
CREATE OR REPLACE FUNCTION record_game_play(
  p_user_id UUID,
  p_amount_paid DECIMAL,
  p_prize_won DECIMAL DEFAULT 0,
  p_is_winner BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_play_id UUID;
BEGIN
  -- Insert game play record
  INSERT INTO public.game_plays (user_id, amount_paid, prize_won, is_winner)
  VALUES (p_user_id, p_amount_paid, p_prize_won, p_is_winner)
  RETURNING id INTO v_play_id;
  
  -- Update user balance (deduct cost, add prize if won)
  UPDATE public.users 
  SET available_balance = available_balance - p_amount_paid + p_prize_won,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description, status, reference_type, reference_id)
  VALUES (
    p_user_id,
    'game',
    CASE WHEN p_is_winner THEN (p_prize_won - p_amount_paid) ELSE -p_amount_paid END,
    CASE WHEN p_is_winner THEN 
      'Game win - Prize: Rs.' || p_prize_won || ', Cost: Rs.' || p_amount_paid
    ELSE 
      'Game play - Cost: Rs.' || p_amount_paid
    END,
    'completed',
    'game_play',
    v_play_id
  );
  
  RETURN v_play_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
