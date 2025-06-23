import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CreditCard, Building2, Wallet2, Minus, Settings, User, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { toastService } from '@/services/toastService';
import { formatCurrencyWithSettings } from '@/lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface WithdrawGateway {
  id: string;
  name: string;
  minimum_amount: number;
  maximum_amount: number;
  fees_percentage: number;
  fees_fixed: number;
  configuration: any;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const form = useForm({
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      iban: ''
    }
  });

  useEffect(() => {
    fetchWithdrawalMethods();
  }, []);

  const fetchWithdrawalMethods = async () => {
    try {
      const { data: gateways, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('type', 'withdraw')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal gateways:', error);
        toastService.error('Failed to load withdrawal methods');
      } else {
        const methods = gateways?.map(gateway => ({
          id: gateway.id,
          name: gateway.name,
          minimum_amount: gateway.minimum_amount || 0,
          maximum_amount: gateway.maximum_amount || 0,
          fees_percentage: gateway.fees_percentage || 0,
          fees_fixed: gateway.fees_fixed || 0,
          configuration: gateway.configuration || {}
        })) || [];

        setWithdrawalMethods(methods);
      }
    } catch (error) {
      console.error('Error in fetchWithdrawalMethods:', error);
      toastService.error('Failed to load withdrawal information');
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = (gateway: WithdrawGateway, withdrawalAmount: number) => {
    const percentageFee = (withdrawalAmount * gateway.fees_percentage) / 100;
    const totalFees = percentageFee + gateway.fees_fixed;
    return totalFees;
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toastService.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (!selectedMethod) {
      toastService.error('Please select a withdrawal method.');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    const selectedGateway = withdrawalMethods.find(m => m.id === selectedMethod);
    
    if (!selectedGateway) {
      toastService.error('Invalid withdrawal method selected');
      return;
    }

    // Check minimum and maximum amounts
    if (withdrawalAmount < selectedGateway.minimum_amount) {
      toastService.error(`Minimum withdrawal amount is ${formatCurrencyWithSettings(selectedGateway.minimum_amount, systemSettings)}`);
      return;
    }

    if (selectedGateway.maximum_amount && withdrawalAmount > selectedGateway.maximum_amount) {
      toastService.error(`Maximum withdrawal amount is ${formatCurrencyWithSettings(selectedGateway.maximum_amount, systemSettings)}`);
      return;
    }
    
    // Check if user has sufficient balance (including fees)
    const fees = calculateFees(selectedGateway, withdrawalAmount);
    const totalDeduction = withdrawalAmount + fees;
    
    if (!user?.available_balance || user.available_balance < totalDeduction) {
      toastService.error(`Insufficient balance. You need ${formatCurrencyWithSettings(totalDeduction, systemSettings)} (including ${formatCurrencyWithSettings(fees, systemSettings)} fees)`);
      return;
    }

    const formData = form.getValues();
    if (!formData.accountHolderName || !formData.accountNumber || !formData.bankName) {
      toastService.error('Please fill in all required account details.');
      return;
    }

    setSaving(true);
    
    // Show loading toast for better UX
    const loadingToast = toastService.loading('Processing withdrawal request...');

    try {
      // Create account details object in the specified format
      const accountDetails = {
        instructions: "Transfer money to the bank account details shown below",
        bank_account_details: {
          iban: formData.iban || '',
          bank_name: formData.bankName,
          account_number: formData.accountNumber,
          account_holder_name: formData.accountHolderName
        }
      };

      // First, deduct the amount from user's balance
      const newBalance = user.available_balance - totalDeduction;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          available_balance: newBalance,
          total_withdrawals: (user.total_withdrawals || 0) + withdrawalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        toastService.dismiss(loadingToast);
        toastService.error('Failed to update balance. Please try again.');
        return;
      }

      // Create withdrawal request with account details
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          gateway_id: selectedMethod,
          amount: withdrawalAmount,
          withdrawal_method: selectedGateway.name,
          status: 'pending',
          account_details: accountDetails
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal:', withdrawalError);
        // Rollback balance update
        await supabase
          .from('users')
          .update({ 
            available_balance: user.available_balance,
            total_withdrawals: user.total_withdrawals || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);
        
        toastService.dismiss(loadingToast);
        toastService.error('Failed to create withdrawal request. Please try again.');
        return;
      }

      // Create transaction history entry for the withdrawal request
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: -withdrawalAmount, // Negative amount for withdrawal
          description: `Withdrawal request to ${formData.bankName} - ${formData.accountNumber}`,
          status: 'pending',
          reference_type: 'withdrawal',
          reference_id: withdrawalData.id
        });

      if (transactionError) {
        console.error('Error creating transaction history:', transactionError);
        // Don't fail the withdrawal if transaction history fails, just log it
        console.warn('Transaction history creation failed, but withdrawal request was successful');
      }

      // Refresh user data to update context
      await refreshUser();

      // Dismiss loading toast and show success
      toastService.dismiss(loadingToast);
      toastService.success(`Withdrawal request of ${formatCurrencyWithSettings(withdrawalAmount, systemSettings)} submitted successfully! Your request is being processed.`);
      
      // Navigate to pending withdrawals page
      navigate('/withdraw-pending');
    } catch (error) {
      console.error('Error in handleWithdraw:', error);
      toastService.dismiss(loadingToast);
      toastService.error('An unexpected error occurred. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-3 pt-6 pb-4 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Link to="/" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Wallet2 className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white">Withdraw Money</h1>
                </div>
              </div>
            </div>
            
            {/* Compact Balance Display */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-xl">
              <p className="text-emerald-100 text-xs">Available Balance</p>
              <p className="text-white text-lg font-bold">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</p>
            </div>
          </div>
        </div>

        {/* Compact Content with proper spacing */}
        <div className="flex-1 p-3 space-y-3 relative z-10">
          {/* Compact Amount Input */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <Minus className="w-4 h-4 mr-2 text-red-600" />
                Enter Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl font-bold text-center h-12 border-2 border-emerald-200 focus:border-emerald-500 rounded-lg"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
                  {systemSettings?.currencySymbol || 'Rs.'}
                </span>
              </div>
              
              {/* Compact Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    className="h-9 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 rounded-lg text-xs font-medium text-emerald-700"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {formatCurrencyWithSettings(quickAmount, systemSettings)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compact Bank Selection */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Select Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {withdrawalMethods.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No banks available for withdrawal
                </div>
              ) : (
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  {withdrawalMethods.map((method) => {
                    const withdrawalAmount = parseFloat(amount) || 0;
                    const fees = calculateFees(method, withdrawalAmount);
                    const totalDeduction = withdrawalAmount + fees;

                    return (
                      <div
                        key={method.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <div className={`p-1.5 rounded-lg ${
                              selectedMethod === method.id
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 text-sm">{method.name}</h3>
                              <p className="text-xs text-gray-600">
                                Min: {formatCurrencyWithSettings(method.minimum_amount || 0, systemSettings)}
                                {method.maximum_amount && method.maximum_amount > 0 && 
                                  ` - Max: ${formatCurrencyWithSettings(method.maximum_amount, systemSettings)}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {withdrawalAmount > 0 && (
                              <>
                                <p className="text-xs text-gray-600">Fee: {formatCurrencyWithSettings(fees, systemSettings)}</p>
                                <p className="font-medium text-red-600 text-sm">
                                  Total: {formatCurrencyWithSettings(totalDeduction, systemSettings)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Compact Account Details Form */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMethod ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <User className="w-3 h-3 inline mr-1" />
                      Account Holder Name *
                    </label>
                    <Input
                      placeholder="Enter full name as per bank account"
                      {...form.register('accountHolderName')}
                      className="border border-emerald-200 focus:border-emerald-500 rounded-lg h-9 text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Hash className="w-3 h-3 inline mr-1" />
                      Account Number *
                    </label>
                    <Input
                      placeholder="Enter bank account number"
                      {...form.register('accountNumber')}
                      className="border border-emerald-200 focus:border-emerald-500 rounded-lg h-9 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      Bank Name *
                    </label>
                    <Input
                      placeholder="Enter bank name"
                      {...form.register('bankName')}
                      className="border border-emerald-200 focus:border-emerald-500 rounded-lg h-9 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <CreditCard className="w-3 h-3 inline mr-1" />
                      IBAN (Optional)
                    </label>
                    <Input
                      placeholder="Enter IBAN if available"
                      {...form.register('iban')}
                      className="border border-emerald-200 focus:border-emerald-500 rounded-lg h-9 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Please select a bank above to continue
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              <strong>Security Notice:</strong> Your account details are used only for this withdrawal request and are not saved to your profile.
            </p>
          </div>

          {/* Compact Withdrawal Fee Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Processing fees apply depending on the withdrawal method selected. Minimum withdrawal amount varies by method.
            </p>
          </div>

          {/* Compact Withdraw Button */}
          <Button 
            onClick={handleWithdraw}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl text-base"
            disabled={!amount || !selectedMethod || saving}
          >
            <Minus className="w-4 h-4 mr-2" />
            {saving ? 'Processing...' : `Withdraw ${formatCurrencyWithSettings(parseFloat(amount) || 0, systemSettings)}`}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Withdraw;
