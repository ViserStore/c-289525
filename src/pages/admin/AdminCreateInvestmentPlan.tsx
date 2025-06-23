import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import toastService from '@/services/toastService';
import AdminLayout from '@/components/AdminLayout';
import { investmentPlansService } from '@/services/investmentPlansService';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getCurrencyDisplay } from '@/lib/utils';

const AdminCreateInvestmentPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profitType, setProfitType] = useState('percent'); // 'percent' or 'simple'
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();
  const [newPlan, setNewPlan] = useState({
    name: '',
    minAmount: '',
    maxAmount: '',
    duration: '',
    dailyReturn: '',
    description: ''
  });

  const currencySymbol = getCurrencyDisplay(currencySettings);

  const handleCreatePlan = async () => {
    if (!isFormValid()) return;

    try {
      setLoading(true);
      
      // Convert profit based on type
      let dailyProfitPercentage;
      if (profitType === 'percent') {
        dailyProfitPercentage = parseFloat(newPlan.dailyReturn) / 100; // Convert percentage to decimal
      } else {
        // Simple profit: calculate percentage based on minimum amount
        const minAmount = parseFloat(newPlan.minAmount);
        const simpleProfitAmount = parseFloat(newPlan.dailyReturn);
        dailyProfitPercentage = simpleProfitAmount / minAmount; // Convert to percentage
      }

      const planData = {
        name: newPlan.name,
        minimum_amount: parseFloat(newPlan.minAmount),
        maximum_amount: newPlan.maxAmount ? parseFloat(newPlan.maxAmount) : null,
        duration_days: parseInt(newPlan.duration),
        daily_profit_percentage: dailyProfitPercentage,
        description: newPlan.description,
        is_active: true
      };

      await investmentPlansService.create(planData);
      
      toastService.success("Investment plan created successfully");
      navigate('/admin/investment-plans');
    } catch (error) {
      console.error('Error creating plan:', error);
      toastService.error("Failed to create investment plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/investment-plans');
  };

  const isFormValid = () => {
    return newPlan.name && 
           newPlan.minAmount && 
           newPlan.duration && 
           newPlan.dailyReturn && 
           newPlan.description;
  };

  const calculateDisplayProfit = () => {
    if (!newPlan.dailyReturn || !newPlan.duration) return '0';
    
    if (profitType === 'percent') {
      return (parseFloat(newPlan.dailyReturn) * parseFloat(newPlan.duration)).toFixed(1);
    } else {
      // For simple profit, show total amount
      return (parseFloat(newPlan.dailyReturn) * parseFloat(newPlan.duration)).toFixed(2);
    }
  };

  if (systemSettingsLoading) {
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Investment Plan</h1>
              <p className="text-gray-600 text-sm sm:text-base">Design a new investment plan for your users</p>
            </div>
          </div>
        </div>

        {/* Create Plan Form */}
        <div className="px-2 sm:px-4 lg:px-6">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="planName">Plan Name *</Label>
                    <Input
                      id="planName"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Premium Plan"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profitType">Profit Type *</Label>
                    <Select value={profitType} onValueChange={setProfitType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="simple">Simple Amount ({currencySymbol})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dailyReturn">
                      Daily Return {profitType === 'percent' ? '(%)' : `(${currencySymbol})`} *
                    </Label>
                    <Input
                      id="dailyReturn"
                      type="number"
                      step="0.1"
                      value={newPlan.dailyReturn}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, dailyReturn: e.target.value }))}
                      placeholder={profitType === 'percent' ? "2.5" : "25"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profitType === 'percent' 
                        ? 'Enter percentage (e.g., 2.5 for 2.5%)' 
                        : `Enter daily profit amount in ${currencySymbol}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="minAmount">Minimum Amount ({currencySymbol}) *</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={newPlan.minAmount}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, minAmount: e.target.value }))}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount ({currencySymbol})</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={newPlan.maxAmount}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, maxAmount: e.target.value }))}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label>Total Return</Label>
                    <Input
                      value={calculateDisplayProfit() + (profitType === 'percent' ? '%' : ` ${currencySymbol}`)}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Automatically calculated</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the investment plan benefits and target audience..."
                  rows={4}
                />
              </div>

              {/* Preview Section */}
              {isFormValid() && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-3">Plan Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Investment Range:</span>
                      <div className="font-medium">{currencySymbol}{newPlan.minAmount} - {currencySymbol}{newPlan.maxAmount || 'No limit'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{newPlan.duration} days</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Daily Return:</span>
                      <div className="font-medium text-green-600">
                        {profitType === 'percent' ? `${newPlan.dailyReturn}%` : `${currencySymbol}${newPlan.dailyReturn}`}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Return:</span>
                      <div className="font-bold text-green-600">
                        {calculateDisplayProfit()}{profitType === 'percent' ? '%' : ` ${currencySymbol}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                <Button 
                  onClick={handleCreatePlan}
                  disabled={!isFormValid() || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Plan'}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateInvestmentPlan;
