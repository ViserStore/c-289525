
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type InvestmentPlan = Tables<'investment_plans'>;
export type NewInvestmentPlan = TablesInsert<'investment_plans'>;
export type UpdateInvestmentPlan = TablesUpdate<'investment_plans'>;

export const investmentPlansService = {
  // Get all investment plans
  async getAll() {
    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get active investment plans for users
  async getActive() {
    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('minimum_amount', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get single investment plan
  async getById(id: string) {
    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new investment plan
  async create(plan: NewInvestmentPlan) {
    const { data, error } = await supabase
      .from('investment_plans')
      .insert(plan)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update investment plan
  async update(id: string, updates: UpdateInvestmentPlan) {
    const { data, error } = await supabase
      .from('investment_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete investment plan
  async delete(id: string) {
    const { error } = await supabase
      .from('investment_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Toggle plan status
  async toggleStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('investment_plans')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
