import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from './ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { userService } from '@/services/userService';
import { formatCurrencyWithSettings } from '../lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const BalanceCard = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();

  const { data: userData, isLoading } = useOptimizedQuery({
    queryKey: ['user', user?.id],
    queryFn: () => userService.getUserById(user!.id),
    enabled: !!user?.id,
    staleTime: 10000,
    cacheTime: 60000
  });

  const balance = userData?.available_balance || 0;
  const userPlan = userData?.investment_plans?.name || null;

  const toggleBalance = () => setHideBalance(!hideBalance);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Card className="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 p-4 sm:p-6 text-white border-0 shadow-xl rounded-2xl overflow-hidden relative min-h-[140px]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Card className="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 p-4 sm:p-6 text-white border-0 shadow-xl rounded-2xl overflow-hidden relative min-h-[140px]">
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-lg mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center">
                <Wallet size={14} className="sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white/90 truncate">{systemSettings.siteName} Account</span>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 flex-shrink-0 ml-2">
              <span className="text-[10px] sm:text-xs mr-1 sm:mr-2 text-white/90 font-medium">
                {userPlan || 'No Plan'}
              </span>
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 flex-shrink-0 shadow-sm"></div>
            </div>
          </div>
          
          <div className="text-[10px] sm:text-xs text-white/80 mb-2 font-medium">Available Balance</div>
          
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <h3 className="text-lg sm:text-2xl font-bold text-white mr-2 sm:mr-3 truncate">
                  {hideBalance ? '••••••••••' : formatCurrencyWithSettings(balance, systemSettings)}
                </h3>
                <button 
                  onClick={toggleBalance} 
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                >
                  {hideBalance ? <Eye size={16} className="sm:w-[18px] sm:h-[18px]" /> : <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
              
              <div>
                <span className="text-[10px] sm:text-xs text-white/70">
                  Tap to {hideBalance ? 'show' : 'hide'} balance
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link 
                to="/deposit"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                <span>Add Cash</span>
              </Link>
              <Link 
                to="/investment-plans"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-xs font-medium text-white transition-all duration-200 border border-white/20 whitespace-nowrap text-center"
              >
                Upgrade Account
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BalanceCard;
