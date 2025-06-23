
import { supabase } from '@/integrations/supabase/client';

interface LevelUpResult {
  userId: string;
  oldLevel: number;
  newLevel: number;
  bonusAmount: number;
  levelName: string;
}

export const checkAndUpdateUserLevel = async (userId: string): Promise<LevelUpResult | null> => {
  try {
    console.log('Checking level for user:', userId);

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_level, available_balance, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return null;
    }

    const currentLevel = user.user_level || 1;

    // Get referrals count - only count users who have made deposits or investments
    const { data: referrals, error: referralError } = await supabase
      .from('users')
      .select('id, total_deposits')
      .eq('referred_by_user_id', userId);

    if (referralError) {
      console.error('Error fetching referrals:', referralError);
      return null;
    }

    // Count only active referrals (those who have deposited)
    const activeReferralCount = referrals?.filter(ref => (ref.total_deposits || 0) > 0).length || 0;

    console.log(`User has ${activeReferralCount} active referrals, current level: ${currentLevel}`);

    // Get the level they should be at based on active referrals
    const { data: qualifiedLevel, error: levelError } = await supabase
      .from('user_levels')
      .select('level, name, bonus_amount')
      .lte('referrals_required', activeReferralCount)
      .eq('is_active', true)
      .order('referrals_required', { ascending: false })
      .limit(1)
      .single();

    if (levelError || !qualifiedLevel) {
      console.error('Error getting qualified level:', levelError);
      return null;
    }

    const shouldBeLevel = qualifiedLevel.level;
    console.log(`User should be at level: ${shouldBeLevel}`);

    // If they should be at a higher level, update them
    if (shouldBeLevel > currentLevel) {
      console.log(`Upgrading user from level ${currentLevel} to ${shouldBeLevel}`);

      // Update user level
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_level: shouldBeLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user level:', updateError);
        return null;
      }

      // Add bonus amount if applicable
      if (qualifiedLevel.bonus_amount > 0) {
        const newBalance = (user.available_balance || 0) + qualifiedLevel.bonus_amount;
        
        const { error: balanceError } = await supabase
          .from('users')
          .update({
            available_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (balanceError) {
          console.error('Error updating balance:', balanceError);
        }

        // Create transaction record for the bonus
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'level_up_bonus',
            amount: qualifiedLevel.bonus_amount,
            status: 'completed',
            description: `Level up bonus - Reached ${qualifiedLevel.name} (Level ${shouldBeLevel})`,
            reference_type: 'level_up',
            reference_id: userId
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }
      }

      // Create notification
      try {
        await supabase.rpc('create_user_activity_notification', {
          p_user_id: userId,
          p_type: 'level_up',
          p_title: `🎉 Level Up! Welcome to ${qualifiedLevel.name}`,
          p_message: `Congratulations! You've reached Level ${shouldBeLevel}${qualifiedLevel.bonus_amount > 0 ? ` and earned ${qualifiedLevel.bonus_amount} bonus!` : '!'}`,
          p_icon: '🚀',
          p_priority: 'high',
          p_metadata: { 
            old_level: currentLevel, 
            new_level: shouldBeLevel, 
            bonus_amount: qualifiedLevel.bonus_amount,
            level_name: qualifiedLevel.name 
          }
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }

      return {
        userId,
        oldLevel: currentLevel,
        newLevel: shouldBeLevel,
        bonusAmount: qualifiedLevel.bonus_amount,
        levelName: qualifiedLevel.name
      };
    }

    return null;
  } catch (error) {
    console.error('Error in checkAndUpdateUserLevel:', error);
    return null;
  }
};

export const checkAllUsersLevels = async (): Promise<LevelUpResult[]> => {
  try {
    console.log('Checking levels for all users...');
    
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id');

    if (error || !users) {
      console.error('Error fetching users:', error);
      return [];
    }

    const results: LevelUpResult[] = [];

    for (const user of users) {
      const result = await checkAndUpdateUserLevel(user.id);
      if (result) {
        results.push(result);
      }
    }

    console.log(`Level check complete. Updated ${results.length} users.`);
    return results;
  } catch (error) {
    console.error('Error in checkAllUsersLevels:', error);
    return [];
  }
};
