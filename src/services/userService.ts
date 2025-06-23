
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  available_balance: number;
  account_status: string;
  current_plan_id: string;
  created_at: string;
  last_login_at: string;
  total_deposits: number;
  total_withdrawals: number;
  kyc_status: string;
  address: string;
  city: string;
  country: string;
  referral_code: string;
  referred_by_user_id: string;
  profile_image_url: string;
  user_level?: number;
  totalReferrals?: number;
  levelInfo?: {
    name: string;
    description: string;
    color: string;
    benefits: string[];
    bonus_amount: number;
  };
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
  investmentHistory?: Array<{
    id: string;
    amount: number;
    plan_name: string;
    status: string;
    created_at: string;
    start_date: string;
    total_profit_earned: number;
    investment_plans?: {
      name: string;
    };
  }>;
  investment_plans?: {
    name: string;
  };
}

class UserService {
  private static instance: UserService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() - cached.timestamp < this.CACHE_DURATION : false;
  }

  async getUserById(userId: string): Promise<User | null> {
    console.log('UserService.getUserById called with:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn('UserService.getUserById: Invalid userId provided:', userId);
      return null;
    }

    const cacheKey = `user_${userId}`;
    if (this.isValidCache(cacheKey)) {
      console.log('UserService.getUserById: Returning cached data for:', userId);
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('UserService.getUserById: Fetching user from database:', userId);
      
      // First get the basic user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone_number,
          available_balance,
          account_status,
          current_plan_id,
          created_at,
          last_login_at,
          total_deposits,
          total_withdrawals,
          kyc_status,
          address,
          city,
          country,
          referral_code,
          referred_by_user_id,
          profile_image_url,
          user_level,
          investment_plans:current_plan_id (name)
        `)
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('UserService.getUserById: Error fetching user:', userError);
        throw userError;
      }

      if (!userData) {
        console.warn('UserService.getUserById: No user found with ID:', userId);
        return null;
      }

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get investment history
      const { data: investments } = await supabase
        .from('user_investments')
        .select(`
          id,
          amount,
          status,
          created_at,
          start_date,
          total_profit_earned,
          investment_plans:investment_plan_id (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get referral count
      const { count: referralCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('referred_by_user_id', userId);

      // Update user level using database function
      await supabase.rpc('calculate_user_level', { user_id: userId });

      // Get updated user level and level info
      const { data: updatedUserData } = await supabase
        .from('users')
        .select('user_level')
        .eq('id', userId)
        .single();

      const currentLevel = updatedUserData?.user_level || 1;

      // Get level information from database
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('name, description, color, benefits, bonus_amount')
        .eq('level', currentLevel)
        .eq('is_active', true)
        .single();

      // Transform investment history to match the User interface
      const transformedInvestments = investments?.map(investment => ({
        id: investment.id,
        amount: investment.amount,
        plan_name: investment.investment_plans?.name || 'Unknown Plan',
        status: investment.status,
        created_at: investment.created_at,
        start_date: investment.start_date,
        total_profit_earned: investment.total_profit_earned,
        investment_plans: investment.investment_plans
      })) || [];

      // Convert Json[] to string[] for benefits
      const convertBenefits = (benefits: any): string[] => {
        if (!benefits) return [];
        if (Array.isArray(benefits)) {
          return benefits.map(benefit => String(benefit));
        }
        return [];
      };

      const enrichedUser: User = {
        ...userData,
        recentTransactions: transactions || [],
        investmentHistory: transformedInvestments,
        totalReferrals: referralCount || 0,
        user_level: currentLevel,
        levelInfo: levelData ? {
          name: levelData.name,
          description: levelData.description,
          color: levelData.color,
          benefits: convertBenefits(levelData.benefits),
          bonus_amount: Number(levelData.bonus_amount)
        } : undefined
      };

      console.log('UserService.getUserById: Successfully fetched user data:', enrichedUser);
      this.cache.set(cacheKey, { data: enrichedUser, timestamp: Date.now() });
      return enrichedUser;

    } catch (error) {
      console.error('UserService.getUserById: Unexpected error:', error);
      throw error;
    }
  }

  async updateUserLevel(userId: string, level: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          user_level: level,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user level:', error);
      }

      console.log(`User level updated to ${level} for user ${userId}`);
      this.clearCache(userId); // Clear cache to force refresh
    } catch (error) {
      console.error('Error in updateUserLevel:', error);
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Clear cache for this user
    this.clearCache(userId);
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ available_balance: newBalance })
      .eq('id', userId);

    if (error) throw error;

    // Update cache
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.data.available_balance = newBalance;
    }
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(`user_${userId}`);
    } else {
      this.cache.clear();
    }
  }

  // Get all user levels from database
  async getUserLevels(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) {
        console.error('Error fetching user levels:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user levels:', error);
      return [];
    }
  }
}

export const userService = UserService.getInstance();
