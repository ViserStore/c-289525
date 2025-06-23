
import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Gift, 
  Copy, 
  Share2, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Crown,
  TrendingUp,
  Heart,
  Star,
  Users,
  Coins,
  Trophy,
  Zap,
  Target
} from 'lucide-react';
import toastService from '../services/toastService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatAmount } from '../lib/utils';
import { useSystemSettings } from '../hooks/useSystemSettings';

const InviteEarn = () => {
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalCommissionEarned: 0,
    level: 'Bronze'
  });
  const [rewardSettings, setRewardSettings] = useState({
    welcome_bonus: 100,
    referral_bonus: 50,
    commission_percentage: 15
  });
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  
  // Get current website URL
  const currentWebsiteUrl = window.location.origin;
  const referralCode = user?.referral_code || "Loading...";
  const referralLink = `${currentWebsiteUrl}/ref/${referralCode}`;

  // Fetch referral statistics with actual commission data
  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!user?.id) return;

      try {
        // Get count of users referred by this user
        const { count: referralCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_user_id', user.id);

        // Get actual commission earnings from referral_commissions table
        const { data: commissionData, error: commissionError } = await supabase
          .from('referral_commissions')
          .select('commission_amount')
          .eq('referrer_user_id', user.id)
          .eq('status', 'completed');

        if (commissionError) {
          console.error('Error fetching commission data:', commissionError);
        }

        // Calculate total commission earned
        const totalCommissionEarned = commissionData?.reduce((sum, commission) => {
          return sum + (commission.commission_amount || 0);
        }, 0) || 0;

        // Determine level based on referrals
        let level = 'Bronze';
        if (referralCount >= 20) level = 'Gold';
        else if (referralCount >= 10) level = 'Silver';

        setReferralStats({
          totalReferrals: referralCount || 0,
          totalCommissionEarned,
          level
        });
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    fetchReferralStats();
  }, [user?.id]);

  // Fetch reward settings from database
  useEffect(() => {
    const fetchRewardSettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('referral_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['referral_signup_bonus', 'referral_bonus_amount', 'referral_commission_percentage']);

        if (error) {
          console.error('Error fetching referral settings:', error);
          return;
        }

        if (settings) {
          const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = parseFloat(setting.setting_value);
            return acc;
          }, {} as Record<string, number>);

          setRewardSettings({
            welcome_bonus: settingsMap.referral_signup_bonus || 100,
            referral_bonus: settingsMap.referral_bonus_amount || 50,
            commission_percentage: settingsMap.referral_commission_percentage || 15
          });
        }
      } catch (error) {
        console.error('Error fetching reward settings:', error);
      }
    };

    fetchRewardSettings();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toastService.success("Referral link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join easypaisa with my referral code',
        text: `Use my referral code ${referralCode} and get ${formatCurrency(rewardSettings.welcome_bonus, systemSettings.currencySymbol)} bonus!`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toastService.success("Referral link copied to clipboard");
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `🎉 Join easypaisa with my referral code ${referralCode} and get ${formatCurrency(rewardSettings.welcome_bonus, systemSettings.currencySymbol)} bonus! 💰\n\n${referralLink}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const rewards = [
    { 
      icon: <Coins size={16} />, 
      title: formatCurrency(rewardSettings.welcome_bonus, systemSettings.currencySymbol), 
      subtitle: "Welcome Bonus", 
      color: "from-yellow-400 to-orange-500" 
    },
    { 
      icon: <Star size={16} />, 
      title: `Up to ${formatAmount(rewardSettings.commission_percentage)}%`, 
      subtitle: "Commission", 
      color: "from-purple-400 to-pink-500" 
    }
  ];

  const steps = [
    { icon: <Share2 size={14} />, title: "Share Code", desc: "Send your referral code to friends" },
    { icon: <Users size={14} />, title: "Friends Join", desc: "They sign up using your code" },
    { icon: <Coins size={14} />, title: "Earn Together", desc: "Both get instant rewards!" }
  ];

  return (
    <AppLayout headerTitle="Invite & Earn">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Compact Hero Section */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white pb-6 px-2 overflow-hidden -mt-3">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10"></div>
          <div className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-8 left-3 w-8 h-8 bg-white/15 rounded-full animate-bounce"></div>
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-8 left-2 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
          
          <div className="relative z-10 max-w-sm mx-auto pt-2">
            {/* Compact animated icon */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="bg-white/20 p-3 rounded-full shadow-2xl animate-scale-in backdrop-blur-sm border border-white/30">
                  <Gift size={28} className="text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles size={8} className="text-yellow-800" />
                </div>
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-center mb-2 animate-fade-in">
              🎉 Invite Friends & Earn Big! 🎉
            </h1>
            <p className="text-center text-green-100 text-sm mb-4 animate-fade-in leading-relaxed">
              Share the love, share the wealth! Every friend you invite makes both of you richer ✨
            </p>
            
            {/* Compact floating stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center bg-white/15 rounded-lg p-2 backdrop-blur-sm border border-white/20 animate-fade-in hover:bg-white/20 transition-all">
                <div className="text-lg font-bold flex items-center justify-center gap-1 mb-0.5">
                  <Users size={12} />
                  {referralStats.totalReferrals}
                </div>
                <div className="text-xs text-green-100 font-medium">Friends Invited</div>
              </div>
              <div className="text-center bg-white/15 rounded-lg p-2 backdrop-blur-sm border border-white/20 animate-fade-in hover:bg-white/20 transition-all">
                <div className="text-lg font-bold mb-0.5">{formatCurrency(referralStats.totalCommissionEarned, systemSettings.currencySymbol)}</div>
                <div className="text-xs text-green-100 font-medium">Total Commission</div>
              </div>
              <div className="text-center bg-white/15 rounded-lg p-2 backdrop-blur-sm border border-white/20 animate-fade-in hover:bg-white/20 transition-all">
                <div className="text-lg font-bold flex items-center justify-center gap-1 mb-0.5">
                  <Crown size={12} />
                  {referralStats.level}
                </div>
                <div className="text-xs text-green-100 font-medium">Your Level</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 -mt-4 pb-4 space-y-3 max-w-sm mx-auto">
          
          {/* Compact Referral Code Card */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden animate-fade-in">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                  <Share2 size={12} className="text-white" />
                </div>
                <div>
                  <div className="text-sm">Your Magic Code ✨</div>
                  <div className="text-xs text-gray-500 font-normal">Share & earn together!</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              {/* Compact code display */}
              <div className="relative bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-4 rounded-xl border-2 border-dashed border-green-200 shadow-inner">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded-full text-xs font-medium text-green-600 border border-green-200">
                  REFERRAL CODE
                </div>
                <div className="text-center pt-1">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 mb-2 tracking-widest animate-pulse">
                    {referralCode}
                  </div>
                  <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    <Zap size={10} className="text-yellow-500" />
                    Instant rewards for both of you!
                    <Zap size={10} className="text-yellow-500" />
                  </p>
                </div>
              </div>
              
              {/* Compact action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleCopyCode}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-3 text-xs font-semibold rounded-lg"
                >
                  <div className="flex items-center gap-1">
                    {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied! 🎉' : 'Copy Link'}
                  </div>
                </Button>
                <Button 
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  className="border-2 border-green-500 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-3 text-xs font-semibold rounded-lg bg-white/80 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-1">
                    <Share2 size={12} />
                    WhatsApp 📱
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compact How it works */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden animate-fade-in">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Target size={12} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">How It Works</h3>
                  <p className="text-xs text-gray-500">Simple steps to earn</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <div className="flex items-center">
                        {step.icon}
                        <span className="text-white font-bold ml-0.5 text-xs">{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-xs">{step.title}</div>
                      <div className="text-xs text-gray-600">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compact bottom spacing */}
          <div className="flex justify-center gap-4 text-xs text-gray-500 py-4">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Instant Rewards</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span>No Limits</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Easy Sharing</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InviteEarn;
