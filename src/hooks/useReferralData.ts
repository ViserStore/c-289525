import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReferredUser {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  user_level: number;
  available_balance: number;
  total_deposits: number;
  levelInfo?: {
    name: string;
    color: string;
  };
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  totalCommissionEarned: number;
  currentLevel: number;
  referredUsers: ReferredUser[];
}

export const useReferralData = () => {
  const [referralData, setReferralData] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    totalCommissionEarned: 0,
    currentLevel: 1,
    referredUsers: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch users referred by current user
        const { data: referredUsers, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            email,
            phone_number,
            created_at,
            user_level,
            available_balance,
            total_deposits
          `)
          .eq('referred_by_user_id', user.id)
          .order('created_at', { ascending: false });

        if (usersError) {
          console.error('Error fetching referred users:', usersError);
          setLoading(false);
          return;
        }

        // Fetch actual commission earnings from referral_commissions table
        const { data: commissionData, error: commissionError } = await supabase
          .from('referral_commissions')
          .select('commission_amount')
          .eq('referrer_user_id', user.id)
          .eq('status', 'completed');

        if (commissionError) {
          console.error('Error fetching commission data:', commissionError);
        }

        // Calculate total commission earnings from actual commissions
        const totalCommissionEarned = commissionData?.reduce((sum, commission) => {
          return sum + (commission.commission_amount || 0);
        }, 0) || 0;

        // Keep totalEarnings for backward compatibility (same as commission for now)
        const totalEarnings = totalCommissionEarned;

        // Fetch level information for each user
        const usersWithLevels = await Promise.all(
          (referredUsers || []).map(async (referredUser) => {
            const { data: levelData } = await supabase
              .from('user_levels')
              .select('name, color')
              .eq('level', referredUser.user_level)
              .eq('is_active', true)
              .single();

            return {
              ...referredUser,
              levelInfo: levelData || { name: 'Bronze Explorer', color: '#cd7f32' }
            };
          })
        );

        setReferralData({
          totalReferrals: referredUsers?.length || 0,
          totalEarnings,
          totalCommissionEarned,
          currentLevel: user.user_level || 1,
          referredUsers: usersWithLevels
        });

      } catch (error) {
        console.error('Error in fetchReferralData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [user?.id, user?.user_level]);

  return { referralData, loading };
};
