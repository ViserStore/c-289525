import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Star, Shield, Zap, Calendar, Target, Award, ArrowRight, User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { investmentPlansService } from '@/services/investmentPlansService';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  available_balance: number;
  current_plan_id: string | null;
  created_at: string;
}

interface UserInvestment {
  id: string;
  amount: number;
  total_profit_earned: number;
  status: string;
  created_at: string;
  plan: {
    name: string;
    daily_profit_percentage: number;
    duration_days: number;
  };
}

const InvestmentProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate totals from investments
  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = userInvestments.reduce((sum, inv) => sum + inv.total_profit_earned, 0);

  useEffect(() => {
    fetchUserData();
    fetchUserInvestments();
  }, []);

  const fetchUserData = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      
      try {
        // Fetch real-time user data from database with only existing columns
        const { data: dbUserData, error } = await supabase
          .from('users')
          .select('id, full_name, email, available_balance, current_plan_id, created_at')
          .eq('id', user.id)
          .single();

        if (dbUserData && !error) {
          setUserData(dbUserData as UserData);
          
          // Fetch current plan details if user has one
          if (dbUserData.current_plan_id) {
            const plan = await investmentPlansService.getById(dbUserData.current_plan_id);
            setCurrentPlan(plan);
          }
        } else {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      }
    }
    setLoading(false);
  };

  const fetchUserInvestments = async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      
      try {
        const { data, error } = await supabase
          .from('user_investments')
          .select(`
            id,
            amount,
            total_profit_earned,
            status,
            created_at,
            investment_plans (
              name,
              daily_profit_percentage,
              duration_days
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          const investments = data.map(inv => ({
            id: inv.id,
            amount: inv.amount,
            total_profit_earned: inv.total_profit_earned,
            status: inv.status,
            created_at: inv.created_at,
            plan: {
              name: inv.investment_plans?.name || 'Unknown Plan',
              daily_profit_percentage: inv.investment_plans?.daily_profit_percentage || 0,
              duration_days: inv.investment_plans?.duration_days || 0
            }
          }));
          setUserInvestments(investments);
        }
      } catch (error) {
        console.error('Error fetching investments:', error);
      }
    }
  };

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('investment-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.id}`
        },
        (payload) => {
          console.log('Investment profile data updated:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            setUserData(prev => prev ? {
              ...prev,
              available_balance: newData.available_balance || 0,
              current_plan_id: newData.current_plan_id
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount).replace('PKR', 'Rs.');
  };

  const calculateROI = (invested: number, profit: number) => {
    if (invested === 0) return 0;
    return ((profit / invested) * 100).toFixed(2);
  };

  const calculateDailyProfit = (amount: number, dailyPercentage: number) => {
    return amount * dailyPercentage;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Investment Profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-4">
      {/* Mobile Frame */}
      <div className="w-full max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border-8 border-gray-300 relative">
        {/* Status Bar */}
        <div className="bg-black text-white text-xs flex justify-between items-center px-4 py-1">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-1 h-2 bg-white rounded-sm"></div>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-4 h-full bg-white rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* App Content */}
        <AppLayout headerTitle="Investment Profile" className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 min-h-screen">
          <div className="p-4 space-y-6 pb-32">
            {/* Profile Header with Green Theme */}
            {userData && (
              <div className="relative overflow-hidden">
                <Card className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white border-0 shadow-xl">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm mr-4">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{userData.full_name}</h2>
                          <p className="text-emerald-100 text-sm">{userData.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Investor
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-emerald-100 text-xs mb-1">Available Balance</p>
                        <p className="text-lg font-bold">{formatCurrency(userData.available_balance)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-emerald-100 text-xs mb-1">Total Invested</p>
                        <p className="text-lg font-bold">{formatCurrency(totalInvested)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-emerald-100 text-xs mb-1">Total Profit</p>
                        <p className="text-lg font-bold">{formatCurrency(totalProfit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Current Active Plan */}
            {currentPlan && (
              <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-semibold px-3 py-1 shadow-lg">
                    <Activity className="w-3 h-3 mr-1" />
                    Active Plan
                  </Badge>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 p-4 rounded-2xl mr-4 shadow-lg">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{currentPlan.name}</h3>
                      <p className="text-gray-500 text-sm font-medium">Your Current Investment Plan</p>
                      {currentPlan.description && (
                        <p className="text-gray-600 text-sm mt-1">{currentPlan.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                      <Clock className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 mb-1 font-medium">Duration</p>
                      <p className="text-lg font-bold text-emerald-600">{currentPlan.duration_days} Days</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border border-green-100">
                      <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 mb-1 font-medium">Daily Return</p>
                      <p className="text-lg font-bold text-green-600">
                        {(currentPlan.daily_profit_percentage * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:shadow-2xl text-white font-semibold py-4 rounded-2xl text-lg"
                    onClick={() => navigate('/investment-plans')}
                  >
                    View All Plans
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Stats */}
            {userData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Portfolio ROI</h4>
                        <p className="text-sm text-gray-600">Return on Investment</p>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-3 rounded-xl">
                        <Award className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">
                      {calculateROI(totalInvested, totalProfit)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Investment Status</h4>
                        <p className="text-sm text-gray-600">Current Status</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-xl">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {currentPlan ? 'Active Investor' : 'Ready to Invest'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Investment History */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Investment History</h3>
              
              {userInvestments.map((investment) => (
                <Card key={investment.id} className="border-0 shadow-lg bg-white overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{investment.plan.name}</h4>
                        <p className="text-sm text-gray-600">
                          Started on {new Date(investment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(investment.status)} text-xs font-semibold px-3 py-1`}>
                        {investment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Investment</p>
                        <p className="font-bold text-gray-800">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Daily Profit</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(calculateDailyProfit(investment.amount, investment.plan.daily_profit_percentage))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Total Profit</p>
                        <p className="font-bold text-emerald-600">{formatCurrency(investment.total_profit_earned)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {userInvestments.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">No Investment History</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-6">
                    Start your investment journey today and build your wealth with our premium plans.
                  </p>
                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-xl text-white font-semibold px-6 py-3 rounded-xl"
                    onClick={() => navigate('/investment-plans')}
                  >
                    Start Investing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default InvestmentProfile;
