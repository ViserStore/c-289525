
import { supabase } from '@/integrations/supabase/client';

export const processDepositApproval = async (depositId: string, userId: string, amount: number) => {
  try {
    console.log('=== STARTING DEPOSIT APPROVAL PROCESS ===');
    console.log('Deposit ID:', depositId);
    console.log('User ID:', userId);
    console.log('Amount:', amount);
    
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('available_balance, total_deposits, referred_by_user_id, full_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    if (!userData) {
      console.error('❌ User not found:', userId);
      throw new Error('User not found');
    }

    console.log('📊 Current user data:', {
      balance: userData.available_balance,
      totalDeposits: userData.total_deposits,
      hasReferrer: !!userData.referred_by_user_id,
      referrerId: userData.referred_by_user_id
    });

    // Calculate new balances
    const newBalance = (userData.available_balance || 0) + amount;
    const newTotalDeposits = (userData.total_deposits || 0) + amount;
    
    console.log('💰 Updating user balance:', {
      oldBalance: userData.available_balance,
      newBalance,
      oldTotalDeposits: userData.total_deposits,
      newTotalDeposits
    });

    // Update user balance and total deposits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        available_balance: newBalance,
        total_deposits: newTotalDeposits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user balance:', updateError);
      throw new Error(`Failed to update user balance: ${updateError.message}`);
    }

    console.log('✅ User balance updated successfully');

    // Create deposit transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: `Deposit approved - Rs. ${amount}`,
        reference_type: 'deposit',
        reference_id: depositId
      });

    if (transactionError) {
      console.error('❌ Error creating deposit transaction:', transactionError);
      throw new Error(`Failed to create transaction record: ${transactionError.message}`);
    }

    console.log('✅ Deposit transaction created successfully');

    // The referral commissions will be processed automatically by the database trigger
    // when the deposit status is updated to 'approved'
    console.log('ℹ️ Referral commissions will be processed automatically by database trigger');

    console.log('=== DEPOSIT APPROVAL PROCESS COMPLETED SUCCESSFULLY ===');
    return { 
      success: true, 
      message: 'Deposit approved successfully. Referral commissions processed automatically.',
      userBalance: newBalance,
      totalDeposits: newTotalDeposits
    };

  } catch (error) {
    console.error('❌ CRITICAL ERROR in processDepositApproval:', error);
    throw error;
  }
};
