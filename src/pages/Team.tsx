
import React from 'react';
import AppLayout from '../components/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { 
  Users, 
  Star,
  UserPlus,
  Gift,
  TrendingUp,
  Crown,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react';
import { useReferralData } from '../hooks/useReferralData';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrencyWithSettings } from '../lib/utils';
import { useSystemSettings } from '../hooks/useSystemSettings';

const Team = () => {
  const { referralData } = useReferralData();
  const { settings: systemSettings } = useSystemSettings();

  return (
    <AppLayout headerTitle="Referral Team">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Compact Hero */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 pt-2 pb-4 px-2 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4 blur-sm"></div>
          <div className="absolute bottom-0 left-0 w-14 h-14 bg-white/10 rounded-full translate-y-4 -translate-x-4 blur-sm"></div>
          
          <div className="relative z-10 max-w-sm mx-auto">
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 p-2 rounded-full">
                <UserPlus size={18} className="text-white" />
              </div>
            </div>
            <h1 className="text-lg font-bold mb-1 text-center text-white">Your Referral Team</h1>
            <p className="text-green-100 text-center text-xs">Members who joined through your referral! 🎉</p>
          </div>
        </div>

        <div className="px-2 -mt-2 pb-4 space-y-2 max-w-sm mx-auto">
          
          {/* Team Stats Card */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <TrendingUp size={12} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-800">Team Statistics</h2>
                  <p className="text-gray-500 text-xs">Your referral performance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                    <Users size={14} />
                    {referralData.totalReferrals}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Team Members</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                    <Crown size={14} />
                    {referralData.currentLevel}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Your Level</div>
                </div>
              </div>

              {/* Commission Earnings Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-2 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                      <Percent size={12} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-800">Total Commission</h3>
                      <p className="text-xs text-gray-600">From referral activities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600">{formatCurrencyWithSettings(referralData.totalCommissionEarned, systemSettings)}</div>
                    <div className="text-xs text-emerald-600 font-medium">Earned</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Card */}
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Users size={12} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-800">Team Members</h2>
                  <p className="text-gray-500 text-xs">{referralData.totalReferrals} members in your team</p>
                </div>
              </div>

              {referralData.referredUsers.length > 0 ? (
                <div className="space-y-2">
                  {referralData.referredUsers.map((member) => (
                    <div key={member.id} className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-lg p-2 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                            style={{ 
                              background: `linear-gradient(135deg, ${member.levelInfo?.color || '#6b7280'}, ${member.levelInfo?.color || '#6b7280'}dd)` 
                            }}
                          >
                            <Users size={12} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-xs truncate">{member.full_name}</h3>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1 truncate">
                              <Crown size={8} />
                              Level {member.user_level} - {member.levelInfo?.name || 'Bronze Explorer'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Calendar size={6} />
                                Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-2">
                          <div className="text-xs font-bold text-green-600">{formatCurrencyWithSettings(member.available_balance, systemSettings)}</div>
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <DollarSign size={6} />
                            <span>Balance</span>
                          </div>
                          {member.total_deposits > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Deposits: {formatCurrencyWithSettings(member.total_deposits, systemSettings)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-xs">No team members yet</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Start inviting friends to build your team and earn rewards!
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
                    <div className="flex items-center justify-center gap-1 text-green-700 font-medium text-xs">
                      <Gift size={10} />
                      <span>Share your referral code to get started</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
