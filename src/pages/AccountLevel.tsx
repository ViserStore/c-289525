
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { 
  Crown, 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  Gift,
  TrendingUp,
  Users,
  Coins,
  Award,
  Shield,
  Sparkles,
  ChevronRight,
  Lock,
  Check,
  DollarSign,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { formatCurrency } from '../lib/utils';

interface UserStats {
  totalInvestments: number;
  totalReferrals: number;
  totalDeposits: number;
  daysSinceJoined: number;
  currentLevel: string;
  nextLevelProgress: number;
  totalEarned: number;
  totalCommissionEarned: number;
  totalLevelBonuses: number;
  nextLevelReferrals: number;
  referralsNeeded: number;
}

interface Level {
  id: string;
  level: number;
  name: string;
  color: string;
  icon: React.ReactNode;
  referrals_required: number;
  description: string;
  benefits: string[];
  bonus_amount: number;
  is_active: boolean;
}

interface BonusTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  type: string;
}

const AccountLevel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings: systemSettings } = useSystemSettings();
  const [userStats, setUserStats] = useState<UserStats>({
    totalInvestments: 0,
    totalReferrals: 0,
    totalDeposits: 0,
    daysSinceJoined: 0,
    currentLevel: "Bronze Explorer",
    nextLevelProgress: 0,
    totalEarned: 0,
    totalCommissionEarned: 0,
    totalLevelBonuses: 0,
    nextLevelReferrals: 3,
    referralsNeeded: 3
  });
  const [levels, setLevels] = useState<Level[]>([]);
  const [bonusTransactions, setBonusTransactions] = useState<BonusTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Icon mapping for different levels
  const getIconForLevel = (level: number): React.ReactNode => {
    const iconMap: Record<number, React.ReactNode> = {
      1: <Shield className="w-6 h-6 text-white" />,
      2: <Star className="w-6 h-6 text-white" />,
      3: <Crown className="w-6 h-6 text-white" />,
      4: <Trophy className="w-6 h-6 text-white" />,
      5: <Award className="w-6 h-6 text-white" />
    };
    return iconMap[level] || <Shield className="w-6 h-6 text-white" />;
  };

  useEffect(() => {
    if (user) {
      fetchLevelsAndUserStats();
    }
  }, [user]);

  const fetchLevelsAndUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all levels from database
      const { data: levelsData, error: levelsError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (levelsError) {
        console.error('Error fetching levels:', levelsError);
        return;
      }

      // Transform levels data
      const transformedLevels: Level[] = levelsData?.map(level => ({
        id: level.id,
        level: level.level,
        name: level.name,
        color: level.color,
        icon: getIconForLevel(level.level),
        referrals_required: level.referrals_required,
        description: level.description || '',
        benefits: Array.isArray(level.benefits) ? level.benefits.map(b => String(b)) : [],
        bonus_amount: Number(level.bonus_amount),
        is_active: level.is_active
      })) || [];

      setLevels(transformedLevels);

      // Get user investments
      const { data: investments } = await supabase
        .from('user_investments')
        .select('amount, total_profit_earned')
        .eq('user_id', user.id);

      const totalInvestments = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const totalProfitEarned = investments?.reduce((sum, inv) => sum + Number(inv.total_profit_earned), 0) || 0;

      // Get referral count (only active referrals who have deposited)
      const { data: referrals } = await supabase
        .from('users')
        .select('id, total_deposits')
        .eq('referred_by_user_id', user.id);

      const activeReferralCount = referrals?.filter(ref => (ref.total_deposits || 0) > 0).length || 0;

      // Get commission earnings
      const { data: commissionData } = await supabase
        .from('referral_commissions')
        .select('commission_amount')
        .eq('referrer_user_id', user.id)
        .eq('status', 'completed');

      const totalCommissionEarned = commissionData?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      // Get level bonus transactions
      const { data: bonusTransactions } = await supabase
        .from('transactions')
        .select('id, amount, description, created_at, type')
        .eq('user_id', user.id)
        .eq('type', 'level_up_bonus')
        .order('created_at', { ascending: false });

      const totalLevelBonuses = bonusTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setBonusTransactions(bonusTransactions || []);

      // Calculate current level based on active referrals
      let currentLevel = transformedLevels[0];
      for (let i = transformedLevels.length - 1; i >= 0; i--) {
        const level = transformedLevels[i];
        if (activeReferralCount >= level.referrals_required) {
          currentLevel = level;
          break;
        }
      }

      // Update user level in database if it changed
      if (user.user_level !== currentLevel.level) {
        await supabase.rpc('calculate_user_level', { user_id: user.id });
      }

      // Calculate next level requirements
      const currentLevelIndex = transformedLevels.findIndex(l => l.level === currentLevel.level);
      const nextLevel = currentLevelIndex < transformedLevels.length - 1 ? transformedLevels[currentLevelIndex + 1] : null;
      const nextLevelReferrals = nextLevel ? nextLevel.referrals_required : currentLevel.referrals_required;
      const referralsNeeded = nextLevel ? Math.max(0, nextLevel.referrals_required - activeReferralCount) : 0;

      // Calculate days since joined
      const joinDate = new Date(user.created_at);
      const today = new Date();
      const daysSinceJoined = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate total earned (profits + commissions + bonuses)
      const totalEarned = totalProfitEarned + totalCommissionEarned + totalLevelBonuses;

      setUserStats({
        totalInvestments,
        totalReferrals: activeReferralCount,
        totalDeposits: user.total_deposits,
        daysSinceJoined,
        currentLevel: currentLevel.name,
        nextLevelProgress: nextLevel ? Math.min((activeReferralCount / nextLevel.referrals_required) * 100, 100) : 100,
        totalEarned,
        totalCommissionEarned,
        totalLevelBonuses,
        nextLevelReferrals,
        referralsNeeded
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevelData = () => levels.find(l => l.name === userStats.currentLevel) || levels[0];
  const getNextLevelData = () => {
    const currentIndex = levels.findIndex(l => l.name === userStats.currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const getProgressPercentage = () => {
    const nextLevel = getNextLevelData();
    if (!nextLevel) return 100;
    return Math.min((userStats.totalReferrals / nextLevel.referrals_required) * 100, 100);
  };

  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, systemSettings.currencySymbol);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <AppLayout headerTitle="Account Level">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 max-w-sm mx-auto">
          <div className="p-2 space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden animate-pulse">
                <CardContent className="p-3">
                  <div className="h-16 bg-gradient-to-r from-emerald-200 to-green-200 rounded-2xl mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg"></div>
                    <div className="h-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentLevelData = getCurrentLevelData();
  const nextLevelData = getNextLevelData();

  return (
    <AppLayout headerTitle="Account Level">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 max-w-sm mx-auto">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white pb-4 px-2 overflow-hidden -mt-3">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10"></div>
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-2 w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
          
          <div className="relative z-10 max-w-md mx-auto pt-2">
            <div className="flex justify-center mb-3">
              <div 
                className="p-4 rounded-full shadow-2xl border-4 border-white/30"
                style={{ background: `linear-gradient(to bottom right, ${currentLevelData?.color || '#6b7280'}, ${currentLevelData?.color || '#6b7280'})` }}
              >
                {currentLevelData?.icon}
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-1">
              {userStats.currentLevel}
            </h1>
            <p className="text-center text-green-100 text-sm mb-3">
              {currentLevelData?.description}
            </p>
            
            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center bg-white/15 rounded-2xl p-3 backdrop-blur-sm border border-white/20">
                <div className="text-xl font-bold flex items-center justify-center gap-1 mb-1">
                  <Users size={16} />
                  {userStats.totalReferrals}
                </div>
                <div className="text-xs text-green-100 font-medium">Active Referrals</div>
              </div>
              <div className="text-center bg-white/15 rounded-2xl p-3 backdrop-blur-sm border border-white/20">
                <div className="text-xl font-bold mb-1">{formatCurrencyAmount(userStats.totalEarned)}</div>
                <div className="text-xs text-green-100 font-medium">Total Earned</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 -mt-2 pb-4 space-y-3 max-w-md mx-auto">
          
          {/* Earnings Breakdown Card */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <DollarSign size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm">Earnings Breakdown</div>
                  <div className="text-xs text-gray-500 font-normal">Your total earnings overview</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Commission Earnings</span>
                  <span className="font-bold text-green-600">{formatCurrencyAmount(userStats.totalCommissionEarned)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Level Up Bonuses</span>
                  <span className="font-bold text-blue-600">{formatCurrencyAmount(userStats.totalLevelBonuses)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <span className="text-sm font-bold text-gray-800">Total Earned</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatCurrencyAmount(userStats.totalEarned)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          {nextLevelData && (
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <TrendingUp size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm">Next Level Progress</div>
                    <div className="text-xs text-gray-500 font-normal">Level up to {nextLevelData.name}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{userStats.currentLevel}</span>
                    <span className="text-gray-600">{nextLevelData.name}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                      style={{ 
                        width: `${getProgressPercentage()}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-gray-800">
                      {userStats.totalReferrals} / {nextLevelData.referrals_required} active referrals
                    </span>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-green-600" />
                    <span className="font-bold text-gray-800 text-sm">Requirements to Level Up</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {userStats.referralsNeeded}
                    </div>
                    <div className="text-xs text-gray-600">
                      more active {userStats.referralsNeeded === 1 ? 'referral' : 'referrals'} needed
                    </div>
                  </div>
                </div>

                {/* Next Level Benefits */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Gift size={14} className="text-green-600" />
                    {nextLevelData.name} Benefits
                  </h4>
                  <div className="space-y-1">
                    {nextLevelData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <Zap size={12} className="text-yellow-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-50 rounded-2xl p-2 border border-green-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Coins size={12} className="text-green-600" />
                      <span className="font-medium text-gray-800">
                        Level Up Bonus: {formatCurrencyAmount(nextLevelData.bonus_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bonus Transaction History */}
          {bonusTransactions.length > 0 && (
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <History size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm">Bonus History</div>
                    <div className="text-xs text-gray-500 font-normal">Your level up bonuses</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bonusTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-blue-600 ml-2">
                      +{formatCurrencyAmount(transaction.amount)}
                    </div>
                  </div>
                ))}
                {bonusTransactions.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-500">
                      +{bonusTransactions.length - 3} more bonuses
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Levels Overview */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Crown size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm">All Levels</div>
                  <div className="text-xs text-gray-500 font-normal">Membership tiers & benefits</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {levels.map((level, index) => {
                const isCurrentLevel = level.name === userStats.currentLevel;
                const isAchieved = userStats.totalReferrals >= level.referrals_required;
                
                return (
                  <div 
                    key={level.id} 
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      isCurrentLevel 
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' 
                        : isAchieved
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1.5 rounded-xl shadow-lg"
                          style={{ background: `linear-gradient(to bottom right, ${level.color}, ${level.color})` }}
                        >
                          {level.icon}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-1 text-sm">
                            {level.name}
                            {isCurrentLevel && (
                              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {level.referrals_required} active {level.referrals_required === 1 ? 'referral' : 'referrals'} required
                          </div>
                        </div>
                      </div>
                      
                      {isAchieved && (
                        <div className="text-green-500">
                          <Trophy size={16} />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-1">
                      {level.description}
                    </div>
                    
                    <div className="space-y-0.5 mb-1">
                      {level.benefits.slice(0, 2).map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                          <Zap size={10} className="text-yellow-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {level.bonus_amount > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Coins size={10} className="text-green-600" />
                        <span className="text-green-700 font-medium">
                          Bonus: {formatCurrencyAmount(level.bonus_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
};

export default AccountLevel;
