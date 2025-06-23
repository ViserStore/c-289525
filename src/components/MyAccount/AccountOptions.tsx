
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';

// Icons for the options
const TransactionHistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UpgradeAccountIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 12L12 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AccountLevelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 14L20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UserProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const InviteEarnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const TeamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const NotificationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const AccountOptions = () => {
  const { user } = useAuth();

  // Get user's current level from database or fallback to calculation
  const getCurrentLevel = () => {
    if (user?.levelInfo?.name) {
      return user.levelInfo.name;
    }
    
    // Fallback calculation
    const referralCount = user?.totalReferrals || 0;
    if (referralCount >= 100) return "Legendary";
    if (referralCount >= 75) return "Pearl Master";
    if (referralCount >= 50) return "Sapphire Elite";
    if (referralCount >= 40) return "Ruby Champion";
    if (referralCount >= 30) return "Emerald Pro";
    if (referralCount >= 25) return "Diamond Master";
    if (referralCount >= 20) return "Platinum Elite";
    if (referralCount >= 10) return "Gold Investor";
    if (referralCount >= 3) return "Silver Trader";
    return "Bronze Explorer";
  };

  const getLevelNumber = () => {
    if (user?.user_level) {
      return user.user_level;
    }
    
    // Fallback calculation based on referrals
    const referralCount = user?.totalReferrals || 0;
    if (referralCount >= 25) return 5;
    if (referralCount >= 20) return 4;
    if (referralCount >= 10) return 3;
    if (referralCount >= 3) return 2;
    return 1;
  };

  return (
    <div className="px-4 pt-4 pb-20 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl mb-4 overflow-hidden shadow-lg border border-emerald-100">
        {/* User Profile Details */}
        <Link to="/user-profile" className="block">
          <div className="flex items-center justify-between p-4 border-b border-emerald-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <UserProfileIcon />
              </div>
              <span className="ml-3 font-semibold text-gray-800 text-sm">Profile Details</span>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>

        {/* Account level */}
        <Link to="/account-level" className="block">
          <div className="flex items-center justify-between p-4 border-b border-emerald-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <AccountLevelIcon />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <span className="font-semibold text-gray-800 text-sm">Account Level</span>
                <span className="bg-green-500 text-white ml-2 font-bold px-2 py-1 rounded-full text-xs">
                  Level {getLevelNumber()}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>
        
        {/* Transaction History */}
        <Link to="/transactions" className="block">
          <div className="flex items-center justify-between p-4 border-b border-emerald-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <TransactionHistoryIcon />
              </div>
              <span className="ml-3 font-semibold text-gray-800 text-sm">Transaction History</span>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>

        {/* Team */}
        <Link to="/team" className="block">
          <div className="flex items-center justify-between p-4 border-b border-emerald-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <TeamIcon />
              </div>
              <span className="ml-3 font-semibold text-gray-800 text-sm">My Team</span>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>

        {/* Notifications */}
        <Link to="/notifications" className="block">
          <div className="flex items-center justify-between p-4 border-b border-emerald-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <NotificationIcon />
              </div>
              <span className="ml-3 font-semibold text-gray-800 text-sm">Notifications</span>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>

        {/* Invite & Earn */}
        <Link to="/invite-earn" className="block">
          <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="text-emerald-600 flex-shrink-0 p-2 bg-emerald-100 rounded-xl">
                <InviteEarnIcon />
              </div>
              <span className="ml-3 font-semibold text-gray-800 text-sm">Invite & Earn</span>
            </div>
            <ChevronRight size={20} className="text-emerald-400 flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AccountOptions;
