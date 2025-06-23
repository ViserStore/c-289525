
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  todayDeposits: { amount: number; count: number; change: string };
  todayWithdrawals: { amount: number; count: number; change: string };
  todayNewUsers: { count: number; change: string };
  totalUsers: { count: number; change: string };
  todayActivePlans: { count: number; change: string };
  activeUsersWithPlans: { count: number; change: string };
  pendingDeposits: { amount: number; count: number; change: string };
  pendingWithdrawals: { amount: number; count: number; change: string };
  totalDeposits: { amount: number; count: number; change: string };
  totalWithdrawals: { amount: number; count: number; change: string };
  totalDepositCharges: { amount: number; change: string };
  totalWithdrawalCharges: { amount: number; change: string };
  recentTransactions: Array<{
    id: string;
    user: string;
    type: string;
    amount: string;
    status: string;
  }>;
}

class AdminService {
  private static instance: AdminService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 10000; // 10 seconds for admin data

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() - cached.timestamp < this.CACHE_DURATION : false;
  }

  async getDashboardStats(): Promise<AdminStats> {
    const cacheKey = 'admin_dashboard';
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const today = new Date().toISOString().split('T')[0];

    // Parallel queries for better performance
    const [
      todayDepositsResult,
      todayWithdrawalsResult,
      todayUsersResult,
      totalUsersResult,
      pendingDepositsResult,
      pendingWithdrawalsResult,
      totalDepositsResult,
      totalWithdrawalsResult,
      recentDepositsResult,
      recentWithdrawalsResult
    ] = await Promise.all([
      supabase.from('deposits').select('amount').gte('created_at', today),
      supabase.from('withdrawals').select('amount').gte('created_at', today),
      supabase.from('users').select('id').gte('created_at', today),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('deposits').select('amount').eq('status', 'pending'),
      supabase.from('withdrawals').select('amount').eq('status', 'pending'),
      supabase.from('deposits').select('amount'),
      supabase.from('withdrawals').select('amount'),
      supabase.from('deposits').select('id, amount, status, users!deposits_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(3),
      supabase.from('withdrawals').select('id, amount, status, users!withdrawals_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(3)
    ]);

    const todayDepositAmount = todayDepositsResult.data?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
    const todayWithdrawalAmount = todayWithdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
    const pendingDepositAmount = pendingDepositsResult.data?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
    const pendingWithdrawalAmount = pendingWithdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
    const totalDepositAmount = totalDepositsResult.data?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
    const totalWithdrawalAmount = totalWithdrawalsResult.data?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

    const recentTransactions = [
      ...(recentDepositsResult.data?.map(d => ({
        id: d.id,
        user: d.users?.full_name || 'Unknown',
        type: 'Deposit',
        amount: `Rs. ${Number(d.amount || 0).toLocaleString()}`,
        status: d.status.charAt(0).toUpperCase() + d.status.slice(1)
      })) || []),
      ...(recentWithdrawalsResult.data?.map(w => ({
        id: w.id,
        user: w.users?.full_name || 'Unknown',
        type: 'Withdraw',
        amount: `Rs. ${Number(w.amount || 0).toLocaleString()}`,
        status: w.status.charAt(0).toUpperCase() + w.status.slice(1)
      })) || [])
    ].slice(0, 5);

    const stats: AdminStats = {
      todayDeposits: {
        amount: todayDepositAmount,
        count: todayDepositsResult.data?.length || 0,
        change: '0%'
      },
      todayWithdrawals: {
        amount: todayWithdrawalAmount,
        count: todayWithdrawalsResult.data?.length || 0,
        change: '0%'
      },
      todayNewUsers: {
        count: todayUsersResult.data?.length || 0,
        change: '0%'
      },
      totalUsers: {
        count: totalUsersResult.count || 0,
        change: '0%'
      },
      todayActivePlans: {
        count: 0,
        change: '0%'
      },
      activeUsersWithPlans: {
        count: 0,
        change: '0%'
      },
      pendingDeposits: {
        amount: pendingDepositAmount,
        count: pendingDepositsResult.data?.length || 0,
        change: '0%'
      },
      pendingWithdrawals: {
        amount: pendingWithdrawalAmount,
        count: pendingWithdrawalsResult.data?.length || 0,
        change: '0%'
      },
      totalDeposits: {
        amount: totalDepositAmount,
        count: totalDepositsResult.data?.length || 0,
        change: '0%'
      },
      totalWithdrawals: {
        amount: totalWithdrawalAmount,
        count: totalWithdrawalsResult.data?.length || 0,
        change: '0%'
      },
      totalDepositCharges: {
        amount: 0, // Placeholder - would need a charges table or calculation
        change: '0%'
      },
      totalWithdrawalCharges: {
        amount: 0, // Placeholder - would need a charges table or calculation
        change: '0%'
      },
      recentTransactions
    };

    this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });
    return stats;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const adminService = AdminService.getInstance();
