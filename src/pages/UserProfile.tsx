
import React, { useState, useEffect } from 'react';
import { User, TrendingUp, Calendar, DollarSign, Clock, Target, Award, Shield, Activity, ArrowRight, Sparkles, Crown, Star, PieChart, TrendingDown, Edit3, Eye, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

interface UserDetails {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  available_balance: number;
  account_status: string;
  created_at: string;
  total_deposits: number;
  total_withdrawals: number;
  current_plan_id: string | null;
  user_level: number;
  profile_image_url: string;
  kyc_status: string;
  country: string;
  city: string;
  address: string;
  last_login_at: string;
}

interface InvestmentDetails {
  id: string;
  amount: number;
  total_profit_earned: number;
  status: string;
  start_date: string;
  end_date: string;
  last_profit_date: string | null;
  plan: {
    name: string;
    daily_profit_percentage: number;
    duration_days: number;
  };
}

interface TodayProfit {
  total_today_profit: number;
  active_investments_count: number;
}

interface LevelInfo {
  name: string;
  description: string;
  color: string;
  benefits: string[];
  bonus_amount: number;
}

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [investments, setInvestments] = useState<InvestmentDetails[]>([]);
  const [todayProfit, setTodayProfit] = useState<TodayProfit>({ total_today_profit: 0, active_investments_count: 0 });
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch comprehensive user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone_number,
          available_balance,
          account_status,
          created_at,
          total_deposits,
          total_withdrawals,
          current_plan_id,
          user_level,
          profile_image_url,
          kyc_status,
          country,
          city,
          address,
          last_login_at
        `)
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        toast.error('Failed to load user details');
        return;
      }

      setUserDetails(userData);

      // Fetch user investments with plan details
      const { data: investmentData, error: investmentError } = await supabase
        .from('user_investments')
        .select(`
          id,
          amount,
          total_profit_earned,
          status,
          start_date,
          end_date,
          last_profit_date,
          investment_plans (
            name,
            daily_profit_percentage,
            duration_days
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let formattedInvestments: InvestmentDetails[] = [];
      
      if (investmentError) {
        console.error('Error fetching investments:', investmentError);
      } else {
        formattedInvestments = investmentData?.map(inv => ({
          id: inv.id,
          amount: inv.amount,
          total_profit_earned: inv.total_profit_earned,
          status: inv.status,
          start_date: inv.start_date,
          end_date: inv.end_date,
          last_profit_date: inv.last_profit_date,
          plan: {
            name: inv.investment_plans?.name || 'Unknown Plan',
            daily_profit_percentage: inv.investment_plans?.daily_profit_percentage || 0,
            duration_days: inv.investment_plans?.duration_days || 0
          }
        })) || [];

        setInvestments(formattedInvestments);
      }

      // Get level information
      if (userData.user_level) {
        const { data: levelData, error: levelError } = await supabase
          .from('user_levels')
          .select('name, description, color, benefits, bonus_amount')
          .eq('level', userData.user_level)
          .eq('is_active', true)
          .single();

        if (!levelError && levelData) {
          const convertBenefits = (benefits: any): string[] => {
            if (!benefits) return [];
            if (Array.isArray(benefits)) {
              return benefits.map(benefit => String(benefit));
            }
            return [];
          };

          setLevelInfo({
            name: levelData.name,
            description: levelData.description,
            color: levelData.color,
            benefits: convertBenefits(levelData.benefits),
            bonus_amount: Number(levelData.bonus_amount)
          });
        }
      }

      // Calculate today's profit
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's profit from transactions table
      const { data: transactionProfits, error: transactionError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .in('type', ['commission', 'profit', 'referral_commission'])
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      // Get today's profit from daily_profits table
      const { data: dailyProfits, error: dailyProfitError } = await supabase
        .from('daily_profits')
        .select('profit_amount')
        .eq('user_id', user.id)
        .eq('profit_date', today);

      let totalTodayProfit = 0;

      // Sum profits from transactions
      if (!transactionError && transactionProfits) {
        totalTodayProfit += transactionProfits.reduce((sum, profit) => sum + Number(profit.amount), 0);
      }

      // Sum profits from daily_profits
      if (!dailyProfitError && dailyProfits) {
        totalTodayProfit += dailyProfits.reduce((sum, profit) => sum + Number(profit.profit_amount), 0);
      }

      const activeInvestments = formattedInvestments?.filter(inv => inv.status === 'active').length || 0;
      
      setTodayProfit({
        total_today_profit: totalTodayProfit,
        active_investments_count: activeInvestments
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('User profile updated:', payload);
          if (payload.new) {
            const updatedData = payload.new as any;
            setUserDetails(prev => prev ? {
              ...prev,
              available_balance: updatedData.available_balance || 0,
              total_deposits: updatedData.total_deposits || 0,
              total_withdrawals: updatedData.total_withdrawals || 0,
              account_status: updatedData.account_status || 'active',
              kyc_status: updatedData.kyc_status || 'not_submitted',
              user_level: updatedData.user_level || 1
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_investments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User investments updated:', payload);
          // Refetch investments when they change
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatCurrency = (amount: number) => {
    if (settingsLoading) return `Rs. ${amount.toLocaleString()}`;
    return formatCurrencyWithSettings(amount, systemSettings);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-lime-50 text-lime-700 border-lime-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <AppLayout headerTitle="Profile">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
          <div className="p-2 sm:p-4 space-y-3 sm:space-y-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 sm:h-6 w-32 sm:w-48 mb-2" />
                      <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <Skeleton className="h-16 sm:h-20 rounded-xl" />
                    <Skeleton className="h-16 sm:h-20 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!userDetails) {
    return (
      <AppLayout headerTitle="Profile">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden text-center max-w-sm mx-auto">
            <CardContent className="p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-200 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Oops!</h3>
              <p className="text-emerald-600 font-medium mb-4">Failed to load profile data</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-lg text-sm sm:text-base"
                size="sm"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + inv.total_profit_earned, 0);
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const profitPercentage = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

  return (
    <AppLayout headerTitle="Profile">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="p-2 sm:p-4 space-y-3 sm:space-y-6 pb-20 sm:pb-24 max-w-md mx-auto">
          {/* User Header Card */}
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 overflow-hidden relative">
            {/* Enhanced background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-12 translate-x-8 sm:translate-x-12 blur-sm"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12 blur-sm"></div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            <CardContent className="relative z-10 p-3 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/30 shadow-lg sm:shadow-2xl">
                      {userDetails?.profile_image_url ? (
                        <img 
                          src={userDetails.profile_image_url} 
                          alt={userDetails.full_name}
                          className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                        />
                      ) : (
                        <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      )}
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold mb-1 text-white drop-shadow-lg">
                      {userDetails?.full_name}
                    </h1>
                    <p className="text-white/90 text-xs sm:text-sm mb-1">{userDetails?.email}</p>
                    <p className="text-white/80 text-xs sm:text-sm">{userDetails?.phone_number}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/profile-edit')}
                  size="sm"
                  className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-md shadow-lg rounded-xl sm:rounded-2xl text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                    <Badge className="bg-emerald-500 text-white border-emerald-300 text-xs rounded-lg sm:rounded-xl px-2 py-0.5">
                      {userDetails?.account_status}
                    </Badge>
                  </div>
                  <p className="text-white/70 text-xs mb-1">Available Balance</p>
                  <p className="text-base sm:text-xl font-bold text-white">
                    {formatCurrency(userDetails?.available_balance || 0)}
                  </p>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" />
                  </div>
                  <p className="text-white/70 text-xs mb-1">Member Since</p>
                  <p className="text-sm sm:text-lg font-bold text-white">
                    {formatDate(userDetails?.created_at || '')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level Information */}
          {levelInfo && (
            <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg text-gray-800">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg"
                    style={{ background: `linear-gradient(to bottom right, ${levelInfo.color}, ${levelInfo.color})` }}
                  >
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Level {userDetails?.user_level}: {levelInfo.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{levelInfo.description}</p>
                <div className="space-y-1.5 sm:space-y-2">
                  {levelInfo.benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Performance */}
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center text-base sm:text-lg text-gray-800">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Today's Performance
                <div className="ml-auto">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs border border-emerald-200 rounded-lg sm:rounded-xl px-1.5 py-0.5">
                      Today
                    </Badge>
                  </div>
                  <p className="text-emerald-600 text-xs font-medium mb-1">Today's Profit</p>
                  <p className="text-base sm:text-xl font-bold text-emerald-700">
                    {formatCurrency(todayProfit.total_today_profit)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-100 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  </div>
                  <p className="text-green-600 text-xs font-medium mb-1">Active Plans</p>
                  <p className="text-base sm:text-xl font-bold text-green-700">
                    {todayProfit.active_investments_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Overview */}
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center text-base sm:text-lg text-gray-800">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Portfolio Overview
                <Badge className={`ml-auto text-xs sm:text-sm ${
                  profitPercentage >= 0 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                } rounded-lg sm:rounded-xl px-2 py-1`}>
                  {profitPercentage >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {profitPercentage.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-teal-100 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-emerald-600 text-xs font-medium mb-1">Total Invested</p>
                  <p className="text-base sm:text-xl font-bold text-emerald-700">
                    {formatCurrency(totalInvested)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-emerald-600 text-xs font-medium mb-1">Total Profit</p>
                  <p className="text-base sm:text-xl font-bold text-emerald-700">
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-emerald-100 shadow-sm">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-md">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-xs text-emerald-600 mb-1">Active</p>
                  <p className="text-sm sm:text-lg font-bold text-emerald-600">{activeInvestments.length}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-green-100 shadow-sm">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-md">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-xs text-emerald-600 mb-1">Deposits</p>
                  <p className="text-xs sm:text-sm font-bold text-green-600">{formatCurrency(userDetails?.total_deposits || 0)}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-teal-100 shadow-sm">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-md">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-xs text-emerald-600 mb-1">Net Gain</p>
                  <p className="text-xs sm:text-sm font-bold text-teal-600">
                    {formatCurrency((totalProfit - (userDetails?.total_withdrawals || 0)))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Investments */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between px-1 sm:px-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                Active Investments
              </h3>
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg rounded-lg sm:rounded-xl text-xs px-2 py-1">
                {activeInvestments.length} Active
              </Badge>
            </div>
            
            {activeInvestments.length > 0 ? (
              activeInvestments.map((investment) => {
                const daysUntilExpiry = getDaysUntilExpiry(investment.end_date);
                const dailyProfit = investment.amount * investment.plan.daily_profit_percentage;
                
                return (
                  <Card key={investment.id} className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md">
                              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-gray-800">
                                {investment.plan.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-emerald-600">
                                Started: {formatDate(investment.start_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium shadow-sm rounded-lg sm:rounded-xl px-2 py-1">
                          {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-100 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <Badge className="bg-green-100 text-green-700 text-xs rounded-lg sm:rounded-xl px-1.5 py-0.5">
                              {daysUntilExpiry > 0 ? `${daysUntilExpiry}d` : 'Expired'}
                            </Badge>
                          </div>
                          <p className="text-xs text-green-600 font-medium mb-1">Days Remaining</p>
                          <p className="text-sm sm:text-lg font-bold text-green-700">
                            {daysUntilExpiry > 0 ? daysUntilExpiry : 'Expired'}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs rounded-lg sm:rounded-xl px-1.5 py-0.5">
                              {(investment.plan.daily_profit_percentage * 100).toFixed(2)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-emerald-600 font-medium mb-1">Daily Profit</p>
                          <p className="text-sm sm:text-lg font-bold text-emerald-700">
                            {formatCurrency(dailyProfit)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-emerald-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-emerald-100 shadow-sm">
                          <p className="text-xs text-emerald-600 font-medium mb-1">Investment</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-800">{formatCurrency(investment.amount)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-emerald-100 shadow-sm">
                          <p className="text-xs text-emerald-600 font-medium mb-1">Total Earned</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-700">
                            {formatCurrency(investment.total_profit_earned)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-green-100 shadow-sm">
                          <p className="text-xs text-green-600 font-medium mb-1">Expires</p>
                          <p className="text-xs sm:text-sm font-bold text-green-700">{formatDate(investment.end_date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">No Active Investments</h3>
                  <p className="text-emerald-600 mb-4 sm:mb-6 max-w-sm mx-auto text-sm sm:text-base">
                    Start your investment journey today and watch your money grow with our premium plans
                  </p>
                  <Button 
                    onClick={() => navigate('/investment-plans')}
                    className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white shadow-lg rounded-xl sm:rounded-2xl text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Explore Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Account Statistics */}
          <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center text-base sm:text-lg text-gray-800">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-emerald-700 font-medium text-sm sm:text-base">Member Since</span>
                  </div>
                  <span className="text-emerald-800 font-bold text-sm sm:text-base">{formatDate(userDetails?.created_at || '')}</span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-emerald-700 font-medium text-sm sm:text-base">Total Withdrawals</span>
                  </div>
                  <span className="text-emerald-600 font-bold text-sm sm:text-base">
                    {formatCurrency(userDetails?.total_withdrawals || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-green-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-emerald-700 font-medium text-sm sm:text-base">Total Investments</span>
                  </div>
                  <span className="text-green-600 font-bold text-sm sm:text-base">{investments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-emerald-700 font-medium text-sm sm:text-base">Net Profit</span>
                  </div>
                  <span className="text-emerald-600 font-bold text-sm sm:text-base">
                    {formatCurrency((totalProfit - (userDetails?.total_withdrawals || 0)))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-emerald-700 font-medium text-sm sm:text-base">KYC Status</span>
                  </div>
                  <Badge className={`${
                    userDetails?.kyc_status === 'verified' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : userDetails?.kyc_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  } rounded-lg sm:rounded-xl text-xs px-2 py-1`}>
                    {userDetails?.kyc_status?.replace('_', ' ') || 'Not submitted'}
                  </Badge>
                </div>
                {userDetails?.last_login_at && (
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-emerald-700 font-medium text-sm sm:text-base">Last Login</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm sm:text-base">{formatDate(userDetails.last_login_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
