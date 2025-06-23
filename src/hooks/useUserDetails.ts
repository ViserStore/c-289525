
import { userService } from '@/services/userService';
import { useOptimizedQuery } from './useOptimizedQuery';

export interface UserDetailsData {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  available_balance: number;
  account_status: string;
  created_at: string;
  last_login_at: string;
  total_deposits: number;
  total_withdrawals: number;
  kyc_status: string;
  address: string;
  country: string;
  referral_code: string;
  referred_by_user_id: string;
  current_plan_id: string;
  profile_image_url: string;
  totalReferrals: number;
  recentTransactions: any[];
  investmentHistory: any[];
  investment_plans?: {
    name: string;
  };
}

const isValidUserId = (userId: string | undefined): boolean => {
  if (!userId) return false;
  if (userId === 'undefined' || userId === 'null' || userId === '') return false;
  
  // Check if userId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
};

export const useUserDetails = (userId: string | undefined) => {
  console.log('useUserDetails called with userId:', userId);
  console.log('userId type:', typeof userId);
  console.log('userId valid:', isValidUserId(userId));
  
  return useOptimizedQuery({
    queryKey: ['userDetails', userId],
    queryFn: () => {
      console.log('useUserDetails queryFn executing with userId:', userId);
      if (!isValidUserId(userId)) {
        throw new Error(`Invalid user ID: ${userId}`);
      }
      return userService.getUserById(userId!);
    },
    enabled: isValidUserId(userId),
    staleTime: 20000,
    cacheTime: 120000
  });
};
