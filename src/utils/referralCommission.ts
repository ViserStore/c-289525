
import { supabase } from '@/integrations/supabase/client';

/**
 * Trigger referral commission using the database function
 * This function is now simplified since the heavy lifting is done at the database level
 */
export const triggerDepositCommission = async (userId: string, depositAmount: number) => {
  try {
    console.log('🎯 Triggering referral commission via database function...');
    console.log('User ID:', userId);
    console.log('Deposit Amount:', depositAmount);

    // First check if referral system is enabled
    const { data: systemEnabled, error: systemError } = await supabase
      .from('referral_settings') 
      .select('setting_value')
      .eq('setting_key', 'referral_system_enabled')
      .single();

    if (systemError) {
      console.error('❌ Error checking referral system status:', systemError);
      return { success: false, error: 'Failed to check referral system status' };
    }

    if (!systemEnabled || systemEnabled.setting_value !== 'true') {
      console.log('ℹ️ Referral system is disabled, skipping commission processing');
      return { success: true, processed: false, message: 'Referral system disabled' };
    }

    // Call the database function to process referral commissions
    const { data, error } = await supabase.rpc('process_referral_commission', {
      p_referred_user_id: userId,
      p_trigger_amount: depositAmount,
      p_trigger_type: 'deposit'
    });

    if (error) {
      console.error('❌ Error calling referral commission function:', error);
      throw new Error(`Failed to process referral commission: ${error.message}`);
    }

    console.log('✅ Referral commission function result:', data);
    
    if (data === true) {
      console.log('✅ Referral commissions processed successfully');
    } else {
      console.log('ℹ️ No referral commissions processed (user has no referrer)');
    }

    return { success: true, processed: data };

  } catch (error) {
    console.error('❌ Error in triggerDepositCommission:', error);
    throw error;
  }
};

/**
 * Get referral settings
 */
export const getReferralSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('referral_settings')
      .select('*');

    if (error) {
      console.error('Error fetching referral settings:', error);
      throw error;
    }

    // Convert array of settings to object
    const settings = {
      isEnabled: true,
      enableSignupBonus: true,
      signupBonus: 50, // Default signup bonus
      level1Percentage: 5.0,
      level2Percentage: 3.0,
      level3Percentage: 2.0,
      level4Percentage: 1.0,
      level5Percentage: 0.5
    };

    // Override with database values if they exist
    data?.forEach(setting => {
      switch (setting.setting_key) {
        case 'referral_system_enabled':
          settings.isEnabled = setting.setting_value === 'true';
          break;
        case 'enable_signup_bonus':
          settings.enableSignupBonus = setting.setting_value === 'true';
          break;
        case 'referral_signup_bonus':
          settings.signupBonus = parseFloat(setting.setting_value) || 50;
          break;
        case 'level1_percentage':
          settings.level1Percentage = parseFloat(setting.setting_value) || 5.0;
          break;
        case 'level2_percentage':
          settings.level2Percentage = parseFloat(setting.setting_value) || 3.0;
          break;
        case 'level3_percentage':
          settings.level3Percentage = parseFloat(setting.setting_value) || 2.0;
          break;
        case 'level4_percentage':
          settings.level4Percentage = parseFloat(setting.setting_value) || 1.0;
          break;
        case 'level5_percentage':
          settings.level5Percentage = parseFloat(setting.setting_value) || 0.5;
          break;
      }
    });

    return settings;
  } catch (error) {
    console.error('Error in getReferralSettings:', error);
    // Return default settings on error
    return {
      isEnabled: true,
      enableSignupBonus: true,
      signupBonus: 50,
      level1Percentage: 5.0,
      level2Percentage: 3.0,
      level3Percentage: 2.0,
      level4Percentage: 1.0,
      level5Percentage: 0.5
    };
  }
};

/**
 * Get referral commissions for a user
 */
export const getReferralCommissions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        referred_user:users!referral_commissions_referred_user_id_fkey(full_name)
      `)
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referral commissions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReferralCommissions:', error);
    throw error;
  }
};

/**
 * Get commission statistics for a user
 */
export const getCommissionStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('referral_commissions')
      .select('commission_amount, level, trigger_type')
      .eq('referrer_user_id', userId)
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching commission stats:', error);
      throw error;
    }

    const stats = {
      totalEarnings: 0,
      totalCommissions: data?.length || 0,
      levelBreakdown: {} as Record<number, { count: number; earnings: number }>,
      typeBreakdown: {} as Record<string, { count: number; earnings: number }>
    };

    data?.forEach(commission => {
      stats.totalEarnings += commission.commission_amount;
      
      // Level breakdown
      if (!stats.levelBreakdown[commission.level]) {
        stats.levelBreakdown[commission.level] = { count: 0, earnings: 0 };
      }
      stats.levelBreakdown[commission.level].count++;
      stats.levelBreakdown[commission.level].earnings += commission.commission_amount;
      
      // Type breakdown
      if (!stats.typeBreakdown[commission.trigger_type]) {
        stats.typeBreakdown[commission.trigger_type] = { count: 0, earnings: 0 };
      }
      stats.typeBreakdown[commission.trigger_type].count++;
      stats.typeBreakdown[commission.trigger_type].earnings += commission.commission_amount;
    });

    return stats;
  } catch (error) {
    console.error('Error in getCommissionStats:', error);
    throw error;
  }
};
