import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface SubscribeToInvestmentPlanParams {
  userId: string;
  planId: string;
  amount: number;
}

export const subscribeToInvestmentPlan = async ({ userId, planId, amount }: SubscribeToInvestmentPlanParams) => {
  try {
    // Check user's available balance first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('available_balance')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error('Failed to fetch user balance');
    }

    if (userData.available_balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get plan details for proper investment creation
    const { data: planData, error: planError } = await supabase
      .from('investment_plans')
      .select('name, duration_days')
      .eq('id', planId)
      .single();

    if (planError) {
      throw new Error('Failed to fetch plan details');
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planData.duration_days);

    // Call the stored procedure to subscribe to investment plan
    const { data, error } = await supabase.rpc('subscribe_to_investment_plan', {
      p_user_id: userId,
      p_plan_id: planId,
      p_amount: amount
    });

    if (error) {
      throw error;
    }

    // Deduct amount from user balance (removed current_plan_id update)
    const { error: balanceError } = await supabase
      .from('users')
      .update({ 
        available_balance: userData.available_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (balanceError) {
      throw balanceError;
    }

    // Create transaction record for investment
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'investment',
        amount: amount,
        status: 'completed',
        reference_type: 'investment',
        reference_id: data,
        description: `Investment in ${planData.name} - Rs. ${amount.toLocaleString()}`
      });

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    // Create user notification for successful investment
    const { error: notificationError } = await supabase.rpc('create_user_activity_notification', {
      p_user_id: userId,
      p_type: 'investment',
      p_title: 'Investment Successful',
      p_message: `Your investment of Rs. ${amount.toLocaleString()} in ${planData.name} has been successfully activated and will start generating daily returns.`,
      p_icon: '🎯',
      p_priority: 'high',
      p_metadata: {
        investment_id: data,
        plan_name: planData.name,
        amount: amount,
        duration_days: planData.duration_days
      }
    });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return { success: true, investmentId: data };
  } catch (error: any) {
    console.error('Investment subscription error:', error);
    throw new Error(error.message || 'Failed to subscribe to investment plan');
  }
};

export const getUserInvestments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_investments')
      .select(`
        *,
        investment_plans (
          name,
          daily_profit_percentage,
          duration_days,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Failed to fetch user investments:', error);
    throw new Error('Failed to fetch investments');
  }
};

export const getInvestmentTransactions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['investment', 'profit'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Failed to fetch investment transactions:', error);
    throw new Error('Failed to fetch investment transactions');
  }
};

export const processDailyProfits = async () => {
  try {
    const { data, error } = await supabase.rpc('process_daily_profits');

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Failed to process daily profits:', error);
    throw new Error('Failed to process daily profits');
  }
};
