
import { supabase } from '@/integrations/supabase/client';

export interface WingoBet {
  userId: string;
  betType: 'color' | 'number';
  betValue: string | number;
  amount: number;
  period: string;
}

export interface WingoGame {
  id: string;
  period: string;
  result_number: number;
  result_color: string;
  created_at: string;
}

export interface WingoUserBet {
  id: string;
  user_id: string;
  period: string;
  bet_type: string;
  bet_value: string;
  amount: number;
  win_amount: number;
  is_winner: boolean;
  created_at: string;
}

class WingoService {
  private static instance: WingoService;

  static getInstance(): WingoService {
    if (!WingoService.instance) {
      WingoService.instance = new WingoService();
    }
    return WingoService.instance;
  }

  getCurrentPeriod(): string {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 1) * 1; // Every minute creates new period
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
  }

  private getNumberColor(num: number): string {
    if (num === 0 || num === 5) return 'violet';
    if ([1, 3, 7, 9].includes(num)) return 'green';
    return 'red';
  }

  private calculateWinAmount(betType: string, betValue: string | number, amount: number, resultNumber: number): number {
    const resultColor = this.getNumberColor(resultNumber);
    
    if (betType === 'color') {
      if (betValue === resultColor) {
        // Violet pays 4.5x, others pay 2x
        return betValue === 'violet' ? amount * 4.5 : amount * 2;
      }
    } else if (betType === 'number') {
      if (Number(betValue) === resultNumber) {
        return amount * 9; // Numbers pay 9x
      }
    }
    
    return 0;
  }

  async placeBet(bet: WingoBet): Promise<{ success: boolean; isWin: boolean; winAmount: number; message: string }> {
    try {
      // Check if user has sufficient balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('available_balance')
        .eq('id', bet.userId)
        .single();

      if (userError || !userData) {
        return { success: false, isWin: false, winAmount: 0, message: 'User not found' };
      }

      if (userData.available_balance < bet.amount) {
        return { success: false, isWin: false, winAmount: 0, message: 'Insufficient balance' };
      }

      // Check if game for this period already exists
      let gameResult = await this.getOrCreateGameResult(bet.period);
      
      // Calculate win amount
      const winAmount = this.calculateWinAmount(bet.betType, bet.betValue, bet.amount, gameResult.result_number);
      const isWin = winAmount > 0;

      // Use RPC to place bet and update balance atomically
      const { data, error } = await (supabase as any).rpc('place_wingo_bet', {
        p_user_id: bet.userId,
        p_period: bet.period,
        p_bet_type: bet.betType,
        p_bet_value: bet.betValue.toString(),
        p_amount: bet.amount,
        p_win_amount: winAmount,
        p_is_winner: isWin
      });

      if (error) throw error;

      return {
        success: true,
        isWin,
        winAmount,
        message: isWin ? `You won ${winAmount}!` : 'Better luck next time!'
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      return { success: false, isWin: false, winAmount: 0, message: 'Error placing bet' };
    }
  }

  private async getOrCreateGameResult(period: string): Promise<WingoGame> {
    // Check if game result already exists
    const { data: existingGame, error } = await (supabase as any)
      .from('wingo_games')
      .select('*')
      .eq('period', period)
      .single();

    if (existingGame) {
      return existingGame;
    }

    // Generate random result
    const resultNumber = Math.floor(Math.random() * 10);
    const resultColor = this.getNumberColor(resultNumber);

    // Create new game result
    const { data: newGame, error: createError } = await (supabase as any)
      .from('wingo_games')
      .insert({
        period,
        result_number: resultNumber,
        result_color: resultColor
      })
      .select()
      .single();

    if (createError) throw createError;
    return newGame;
  }

  async getGameHistory(limit = 20): Promise<WingoGame[]> {
    const { data, error } = await (supabase as any)
      .from('wingo_games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getUserBetHistory(userId: string, limit = 20): Promise<WingoUserBet[]> {
    const { data, error } = await (supabase as any)
      .from('wingo_bets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const wingoService = WingoService.getInstance();
