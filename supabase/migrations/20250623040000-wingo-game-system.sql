
-- Create wingo_games table to store game results
CREATE TABLE IF NOT EXISTS public.wingo_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period VARCHAR(20) NOT NULL UNIQUE,
  result_number INTEGER NOT NULL CHECK (result_number >= 0 AND result_number <= 9),
  result_color VARCHAR(10) NOT NULL CHECK (result_color IN ('red', 'green', 'violet')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wingo_bets table to store user bets
CREATE TABLE IF NOT EXISTS public.wingo_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  bet_type VARCHAR(10) NOT NULL CHECK (bet_type IN ('color', 'number')),
  bet_value VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  win_amount DECIMAL(10,2) DEFAULT 0.00,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_wingo_games_period ON public.wingo_games(period);
CREATE INDEX idx_wingo_games_created_at ON public.wingo_games(created_at);
CREATE INDEX idx_wingo_bets_user_id ON public.wingo_bets(user_id);
CREATE INDEX idx_wingo_bets_period ON public.wingo_bets(period);
CREATE INDEX idx_wingo_bets_user_period ON public.wingo_bets(user_id, period);

-- Enable RLS
ALTER TABLE public.wingo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingo_bets ENABLE ROW LEVEL SECURITY;

-- Create policies for wingo_games
CREATE POLICY "Anyone can view wingo games" 
  ON public.wingo_games 
  FOR SELECT 
  USING (true);

-- Create policies for wingo_bets
CREATE POLICY "Users can view their own bets" 
  ON public.wingo_bets 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own bets" 
  ON public.wingo_bets 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Admin can manage all wingo data
CREATE POLICY "Admin can manage all wingo games" 
  ON public.wingo_games 
  FOR ALL 
  USING (true);

CREATE POLICY "Admin can manage all wingo bets" 
  ON public.wingo_bets 
  FOR ALL 
  USING (true);

-- Create function to place wingo bet
CREATE OR REPLACE FUNCTION place_wingo_bet(
  p_user_id UUID,
  p_period VARCHAR(20),
  p_bet_type VARCHAR(10),
  p_bet_value VARCHAR(10),
  p_amount DECIMAL,
  p_win_amount DECIMAL DEFAULT 0,
  p_is_winner BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_bet_id UUID;
  v_balance_change DECIMAL;
BEGIN
  -- Insert bet record
  INSERT INTO public.wingo_bets (user_id, period, bet_type, bet_value, amount, win_amount, is_winner)
  VALUES (p_user_id, p_period, p_bet_type, p_bet_value, p_amount, p_win_amount, p_is_winner)
  RETURNING id INTO v_bet_id;
  
  -- Calculate balance change (deduct bet amount, add win amount if won)
  v_balance_change := p_win_amount - p_amount;
  
  -- Update user balance
  UPDATE public.users 
  SET available_balance = available_balance + v_balance_change,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description, status, reference_type, reference_id)
  VALUES (
    p_user_id,
    'game',
    v_balance_change,
    CASE WHEN p_is_winner THEN 
      'Wingo win - Period: ' || p_period || ', Bet: ' || p_bet_type || ' ' || p_bet_value || ', Win: ' || p_win_amount
    ELSE 
      'Wingo bet - Period: ' || p_period || ', Bet: ' || p_bet_type || ' ' || p_bet_value || ', Amount: ' || p_amount
    END,
    'completed',
    'wingo_bet',
    v_bet_id
  );
  
  RETURN v_bet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
