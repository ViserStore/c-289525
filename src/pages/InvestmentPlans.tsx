import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Star, Shield, Zap, Calendar, Target, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { investmentPlansService } from '@/services/investmentPlansService';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

interface UserData {
  id: string;
  available_balance: number;
}

interface UserInvestment {
  id: string;
  investment_plan_id: string;
  amount: number;
  status: string;
  start_date: string;
  end_date: string;
}

const InvestmentPlans = () => {
  const navigate = useNavigate();
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings();
  const [plans, setPlans] = useState<any[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchUserData();
    fetchUserInvestments();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await investmentPlansService.getActive();
      setPlans(data || []);
    } catch (error: any) {
      toast.error('Failed to load investment plans');
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUserData = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.log('No user found in localStorage');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(currentUser);
      console.log('Checking user data for:', user.id);
      
      // Always fetch fresh data from database to ensure accuracy
      const { data: dbUserData, error } = await supabase
        .from('users')
        .select('id, available_balance')
        .eq('id', user.id)
        .single();

      if (dbUserData && !error) {
        console.log('Fresh user data from database:', dbUserData);
        const typedData = dbUserData as UserData;
        setUserData({
          id: typedData.id,
          available_balance: typedData.available_balance || 0
        });
      } else {
        console.error('Error fetching user data:', error);
        // Only fallback to localStorage if database fetch fails
        setUserData({
          id: user.id,
          available_balance: user.available_balance || 0
        });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInvestments = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    try {
      const user = JSON.parse(currentUser);
      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user investments:', error);
      } else {
        setUserInvestments(data || []);
      }
    } catch (error) {
      console.error('Error fetching user investments:', error);
    }
  };

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!userData?.id) return;

    console.log('Setting up real-time subscription for user:', userData.id);

    const channel = supabase
      .channel('user-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.id}`
        },
        (payload) => {
          console.log('Real-time user data updated:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            setUserData(prev => prev ? {
              ...prev,
              available_balance: newData.available_balance || 0
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  // Set up real-time subscription for user investments
  useEffect(() => {
    if (!userData?.id) return;

    const investmentChannel = supabase
      .channel('user-investments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_investments',
          filter: `user_id=eq.${userData.id}`
        },
        () => {
          fetchUserInvestments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentChannel);
    };
  }, [userData?.id]);

  const handleSelectPlan = (plan: any) => {
    console.log('Selecting plan:', plan.name);
    
    navigate('/invest', {
      state: {
        planId: plan.id,
        planName: plan.name,
        minAmount: plan.minimum_amount,
        maxAmount: plan.maximum_amount,
        dailyReturn: plan.daily_profit_percentage * 100,
        duration: plan.duration_days
      }
    });
  };

  const getActivePlanCount = (planId: string) => {
    return userInvestments.filter(inv => inv.investment_plan_id === planId).length;
  };

  const getTotalInvestedInPlan = (planId: string) => {
    return userInvestments
      .filter(inv => inv.investment_plan_id === planId)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  };

  const calculateDailyProfit = (amount: number, dailyRate: number) => {
    return amount * dailyRate;
  };

  const calculateTotalReturn = (amount: number, dailyRate: number, days: number) => {
    return amount + (amount * dailyRate * days);
  };

  const getPlanIcon = (index: number) => {
    const icons = [Star, TrendingUp, Zap, Award];
    return icons[index % icons.length];
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-emerald-400 to-green-500',
      'from-green-400 to-teal-500',
      'from-teal-400 to-emerald-500',
      'from-emerald-500 to-green-600'
    ];
    return gradients[index % gradients.length];
  };

  const getPlanBadge = (index: number) => {
    const badges = ['Most Popular', 'Best Value', 'Premium', 'Elite'];
    return badges[index % badges.length];
  };

  if (loading || settingsLoading) {
    return (
      <AppLayout headerTitle="Investment Plans" className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerTitle="Investment Plans" className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="p-3 space-y-4">
        {/* Compact Balance Overview */}
        {userData && (
          <div className="relative overflow-hidden">
            <Card className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white border-0 shadow-lg">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs mb-1 font-medium">Available Balance</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrencyWithSettings(userData.available_balance, systemSettings)}</p>
                    <p className="text-emerald-200 text-xs mt-1">Ready to invest</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                {userInvestments.length > 0 && (
                  <div className="mt-3 p-2 bg-emerald-400/20 rounded-lg border border-emerald-300/30">
                    <p className="text-emerald-100 text-xs font-medium">
                      🎯 You have {userInvestments.length} active investment{userInvestments.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compact Investment Plans Grid */}
        <div className="space-y-3">
          {plans.map((plan, index) => {
            const IconComponent = getPlanIcon(index);
            const gradient = getPlanGradient(index);
            const badge = getPlanBadge(index);
            const dailyProfitAmount = calculateDailyProfit(plan.minimum_amount, plan.daily_profit_percentage);
            const totalReturnAmount = calculateTotalReturn(plan.minimum_amount, plan.daily_profit_percentage, plan.duration_days);
            const totalProfitAmount = totalReturnAmount - plan.minimum_amount;
            const activePlanCount = getActivePlanCount(plan.id);
            const totalInvested = getTotalInvestedInPlan(plan.id);

            return (
              <Card key={plan.id} className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
                <div className={`h-1.5 bg-gradient-to-r ${gradient}`}></div>
                
                <div className="absolute top-3 right-3 z-10">
                  <Badge className={`bg-gradient-to-r ${gradient} text-white text-xs font-semibold px-2 py-0.5 shadow-lg`}>
                    <Star className="w-2.5 h-2.5 mr-1" />
                    {badge}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  {/* Compact Plan Header */}
                  <div className="flex items-center mb-4">
                    <div className={`bg-gradient-to-r ${gradient} p-3 rounded-xl mr-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-0.5">{plan.name}</h3>
                      <p className="text-gray-500 text-xs font-medium">Premium Investment Plan</p>
                      {plan.description && (
                        <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Active Investments Info */}
                  {activePlanCount > 0 && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-700">
                          🎯 {activePlanCount} Active Investment{activePlanCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          Total: {formatCurrencyWithSettings(totalInvested, systemSettings)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Compact Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                      <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-0.5 font-medium">Daily Profit</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrencyWithSettings(dailyProfitAmount, systemSettings)}
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
                      <Clock className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-0.5 font-medium">Duration</p>
                      <p className="text-sm font-bold text-green-600">{plan.duration_days} Days</p>
                    </div>
                  </div>

                  {/* Compact Investment Range */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 mb-4 border border-emerald-100">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1 text-emerald-600" />
                      Investment Range
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-medium">Min Amount</span>
                        <span className="font-bold text-gray-800 text-xs">{formatCurrencyWithSettings(plan.minimum_amount, systemSettings)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-medium">Max Amount</span>
                        <span className="font-bold text-gray-800 text-xs">
                          {plan.maximum_amount ? formatCurrencyWithSettings(plan.maximum_amount, systemSettings) : 'No Limit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Profit Calculation */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-4 border border-green-100">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <Award className="w-3 h-3 mr-1 text-green-600" />
                      Profit Projection (Min. Investment)
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Total Profit</span>
                        <span className="font-bold text-green-700 text-xs">{formatCurrencyWithSettings(totalProfitAmount, systemSettings)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Total Return</span>
                        <span className="font-bold text-green-700 text-xs">{formatCurrencyWithSettings(totalReturnAmount, systemSettings)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Plan Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center">
                      <Calendar className="w-4 h-4 text-gray-500 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-xs font-semibold text-gray-700">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-4 h-4 text-green-500 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-xs font-semibold text-green-600">
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  {/* Compact Features */}
                  <div className="flex items-center justify-center space-x-4 mb-4 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 mr-1 text-emerald-500" />
                      <span>Secure Investment</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-green-500" />
                      <span>Daily Returns</span>
                    </div>
                  </div>

                  {/* Compact Action Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${gradient} hover:shadow-xl text-white font-semibold py-3 rounded-xl text-sm transition-all duration-300 group-hover:scale-105`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {activePlanCount > 0 ? 'Invest Again' : 'Start Investment'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Investment Plans Available</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              We're working on bringing you exciting investment opportunities. Check back soon!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default InvestmentPlans;
