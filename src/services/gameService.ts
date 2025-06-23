
import { supabase } from '@/integrations/supabase/client';

export interface GameSettings {
  game_enabled: boolean;
  game_cost_per_play: number;
  game_min_prize: number;
  game_max_prize: number;
  game_win_rate: number;
  game_daily_play_limit: number;
  game_min_balance_required: number;
}

export interface GamePlay {
  id: string;
  user_id: string;
  amount_paid: number;
  prize_won: number;
  is_winner: boolean;
  play_date: string;
  created_at: string;
}

export interface GameStats {
  today_plays: number;
  today_wins: number;
  today_total_paid: number;
  today_total_won: number;
  daily_limit_reached: boolean;
}

class GameService {
  private static instance: GameService;

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  async getGameSettings(): Promise<GameSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'game_enabled',
        'game_cost_per_play',
        'game_min_prize',
        'game_max_prize',
        'game_win_rate',
        'game_daily_play_limit',
        'game_min_balance_required'
      ]);

    if (error) throw error;

    const settings: any = {};
    data?.forEach(setting => {
      const key = setting.setting_key;
      let value: any = setting.setting_value;
      
      if (key === 'game_enabled') {
        value = value === 'true';
      } else {
        value = parseFloat(value || '0');
      }
      
      settings[key] = value;
    });

    return settings as GameSettings;
  }

  async getUserDailyStats(userId: string): Promise<GameStats> {
    const today = new Date().toISOString().split('T')[0];
    
    // Use type assertion to work with game_plays table
    const { data, error } = await (supabase as any)
      .from('game_plays')
      .select('*')
      .eq('user_id', userId)
      .eq('play_date', today);

    if (error) throw error;

    const plays = data || [];
    const settings = await this.getGameSettings();
    
    return {
      today_plays: plays.length,
      today_wins: plays.filter((p: any) => p.is_winner).length,
      today_total_paid: plays.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0),
      today_total_won: plays.reduce((sum: number, p: any) => sum + Number(p.prize_won), 0),
      daily_limit_reached: plays.length >= settings.game_daily_play_limit
    };
  }

  async canUserPlay(userId: string): Promise<{ canPlay: boolean; reason?: string }> {
    try {
      const [settings, stats, userResult] = await Promise.all([
        this.getGameSettings(),
        this.getUserDailyStats(userId),
        supabase.from('users').select('available_balance').eq('id', userId).single()
      ]);

      if (!settings.game_enabled) {
        return { canPlay: false, reason: 'Game is currently disabled' };
      }

      if (stats.daily_limit_reached) {
        return { canPlay: false, reason: `Daily limit of ${settings.game_daily_play_limit} plays reached` };
      }

      if (userResult.error) {
        return { canPlay: false, reason: 'Unable to check balance' };
      }

      if (userResult.data.available_balance < settings.game_cost_per_play) {
        return { canPlay: false, reason: 'Insufficient balance' };
      }

      return { canPlay: true };
    } catch (error) {
      console.error('Error checking if user can play:', error);
      return { canPlay: false, reason: 'Error checking game eligibility' };
    }
  }

  async playGame(userId: string): Promise<{ success: boolean; isWin: boolean; prize: number; message: string }> {
    try {
      const canPlayResult = await this.canUserPlay(userId);
      if (!canPlayResult.canPlay) {
        return { success: false, isWin: false, prize: 0, message: canPlayResult.reason || 'Cannot play game' };
      }

      const settings = await this.getGameSettings();
      const isWin = Math.random() * 100 < settings.game_win_rate;
      const prize = isWin ? 
        Math.floor(Math.random() * (settings.game_max_prize - settings.game_min_prize + 1)) + settings.game_min_prize :
        0;

      // Use type assertion for the RPC call
      const { data, error } = await (supabase as any).rpc('record_game_play', {
        p_user_id: userId,
        p_amount_paid: settings.game_cost_per_play,
        p_prize_won: prize,
        p_is_winner: isWin
      });

      if (error) throw error;

      return {
        success: true,
        isWin,
        prize,
        message: isWin ? `Congratulations! You won Rs.${prize}!` : 'Better luck next time!'
      };
    } catch (error) {
      console.error('Error playing game:', error);
      return { success: false, isWin: false, prize: 0, message: 'Error processing game play' };
    }
  }

  async getUserGameHistory(userId: string, limit = 10): Promise<GamePlay[]> {
    // Use type assertion to work with game_plays table
    const { data, error } = await (supabase as any)
      .from('game_plays')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getGameStatsForAdmin(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    // Use type assertion to work with game_plays table
    const { data, error } = await (supabase as any)
      .from('game_plays')
      .select('*')
      .eq('play_date', today);

    if (error) throw error;

    const plays = data || [];
    const totalPlays = plays.length;
    const totalWins = plays.filter((p: any) => p.is_winner).length;
    const totalPaid = plays.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0);
    const totalWon = plays.reduce((sum: number, p: any) => sum + Number(p.prize_won), 0);

    return {
      today_total_plays: totalPlays,
      today_total_wins: totalWins,
      today_win_rate: totalPlays > 0 ? ((totalWins / totalPlays) * 100).toFixed(2) : 0,
      today_total_paid: totalPaid,
      today_total_won: totalWon,
      today_profit: totalPaid - totalWon
    };
  }
}

export const gameService = GameService.getInstance();
