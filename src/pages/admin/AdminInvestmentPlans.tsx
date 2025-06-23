import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import toastService from '@/services/toastService';
import AdminLayout from '@/components/AdminLayout';
import { investmentPlansService, type InvestmentPlan } from '@/services/investmentPlansService';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminInvestmentPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await investmentPlansService.getAll();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      toastService.error("Failed to load investment plans");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSettings(amount, currencySettings);
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await investmentPlansService.toggleStatus(planId, !currentStatus);
      setPlans(prev => 
        prev.map(plan => 
          plan.id === planId ? { ...plan, is_active: !currentStatus } : plan
        )
      );
      toastService.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating plan status:', error);
      toastService.error("Failed to update plan status");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await investmentPlansService.delete(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      toastService.success("Plan deleted successfully");
    } catch (error) {
      console.error('Error deleting plan:', error);
      toastService.error("Failed to delete plan");
    }
  };

  const handleCreateNewPlan = () => {
    navigate('/admin/investment-plans/create');
  };

  const handleEditPlan = (planId: string) => {
    navigate(`/admin/investment-plans/edit/${planId}`);
  };

  const calculateTotalReturn = (dailyProfit: number, duration: number) => {
    return (dailyProfit * duration).toFixed(2);
  };

  const formatFeatures = (description: string | null) => {
    if (!description) return ['Basic features'];
    return [
      'Daily returns',
      'Capital back',
      'Customer support',
      'Investment protection'
    ];
  };

  if (loading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Investment Plans</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage investment plans</p>
            </div>
            <Button onClick={handleCreateNewPlan} className="h-10">
              <Plus className="w-4 h-4 mr-2" />
              Create New Plan
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-2 sm:px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className={`${plan.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center text-sm sm:text-base mb-2">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span className="truncate">{plan.name}</span>
                      </CardTitle>
                      <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPlan(plan.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{plan.description || 'No description provided'}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Investment Range:</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(plan.minimum_amount)} - {plan.maximum_amount ? formatCurrency(plan.maximum_amount) : 'No limit'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Duration:</span>
                      <span className="text-xs font-medium">{plan.duration_days} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Daily Return:</span>
                      <span className="text-xs font-medium text-green-600">
                        {(plan.daily_profit_percentage * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Return:</span>
                      <span className="text-xs font-bold text-green-600">
                        {calculateTotalReturn(plan.daily_profit_percentage * 100, plan.duration_days)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium mb-2">Features:</h4>
                    <ul className="text-xs space-y-1">
                      {formatFeatures(plan.description).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1 h-1 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs">Status:</span>
                    <Switch
                      checked={plan.is_active || false}
                      onCheckedChange={() => togglePlanStatus(plan.id, plan.is_active || false)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Investment Plans</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first investment plan.</p>
              <Button onClick={handleCreateNewPlan}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInvestmentPlans;
