
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, ArrowLeft, Calculator, TrendingUp, Clock, DollarSign, Shield, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToInvestmentPlan } from '@/services/investmentService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithSettings } from '@/lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface PlanDetails {
  planId: string;
  planName: string;
  minAmount: number;
  maxAmount: number | null;
  dailyReturn: number;
  duration: number;
}

const Invest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  
  // Get plan details from navigation state, or redirect if none provided
  const planDetails = location.state as PlanDetails;
  
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'deposit' | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Fetch user balance from database
  useEffect(() => {
    if (user?.id) {
      fetchUserBalance();
    } else {
      setIsLoadingBalance(false);
    }
  }, [user]);

  // Redirect to investment plans if no plan details provided
  useEffect(() => {
    if (!planDetails) {
      toast.error("Please select an investment plan first");
      navigate('/investment-plans');
    }
  }, [planDetails, navigate]);

  const fetchUserBalance = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingBalance(true);
      const { data, error } = await supabase
        .from('users')
        .select('available_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user balance:', error);
        toast.error('Failed to fetch balance');
        return;
      }

      console.log('Fetched user balance:', data.available_balance);
      setUserBalance(data.available_balance || 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      toast.error('Failed to fetch balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Don't render if no plan details
  if (!planDetails) {
    return null;
  }

  const handleInvestmentAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setInvestmentAmount(value);
    }
  };

  const calculateDailyProfit = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) return 0;
    return (amount * planDetails.dailyReturn) / 100;
  };

  const calculateTotalProfit = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) return 0;
    return (amount * planDetails.dailyReturn * planDetails.duration) / 100;
  };

  const calculateTotalReturn = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) return 0;
    return amount + calculateTotalProfit();
  };

  const isValidAmount = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount)) return false;
    if (amount < planDetails.minAmount) return false;
    if (planDetails.maxAmount && amount > planDetails.maxAmount) return false;
    return true;
  };

  const canInvestWithBalance = () => {
    const amount = parseFloat(investmentAmount);
    return !isNaN(amount) && amount <= userBalance;
  };

  const processBalanceInvestment = async () => {
    if (!user?.id) {
      toast.error("Please log in to invest");
      return false;
    }

    const amount = parseFloat(investmentAmount);
    
    try {
      setIsProcessing(true);
      toast.loading("Processing investment...");

      // Use the investment service which now handles transactions and notifications
      await subscribeToInvestmentPlan({
        userId: user.id,
        planId: planDetails.planId,
        amount
      });

      // Update local balance
      setUserBalance(prev => prev - amount);

      toast.dismiss();
      toast.success(`Successfully invested Rs ${amount.toLocaleString()} in ${planDetails.planName}! Check your transactions and notifications.`);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);

      return true;
    } catch (error: any) {
      console.error('Error processing investment:', error);
      toast.dismiss();
      toast.error(error.message || "Failed to process investment");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceed = async () => {
    if (!isValidAmount() || !paymentMethod) {
      toast.error("Please enter a valid amount and select payment method");
      return;
    }

    if (paymentMethod === 'balance' && !canInvestWithBalance()) {
      toast.error("You don't have enough balance for this investment");
      return;
    }

    if (paymentMethod === 'deposit') {
      // Navigate to deposit with pre-filled amount and plan details
      navigate(`/deposit?amount=${investmentAmount}&planId=${planDetails.planId}&planName=${encodeURIComponent(planDetails.planName)}`);
    } else {
      await processBalanceInvestment();
    }
  };

  return (
    <AppLayout headerTitle="Start Investment Journey" className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="p-3 space-y-4">
        {/* Compact Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/investment-plans')}
          className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-full px-3 py-1.5 text-sm transition-all duration-300"
        >
          <ArrowLeft className="w-3 h-3 mr-2" />
          Back to Plans
        </Button>

        {/* Compact Hero Section */}
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-xl relative">
            <TrendingUp className="w-8 h-8 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Start Your Investment Journey
          </h1>
          <p className="text-gray-600 text-sm">Choose your investment amount and payment method</p>
        </div>

        {/* Compact Plan Details Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10"></div>
          
          <CardHeader className="relative z-10 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{planDetails.planName}</CardTitle>
                  <p className="text-white/80 text-xs">Premium Investment Plan</p>
                </div>
              </div>
              <Badge className="bg-yellow-400 text-yellow-800 border-0 px-2 py-0.5 font-semibold text-xs">
                Popular
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center mb-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs text-white/80">Daily Return</span>
                </div>
                <div className="text-lg font-bold">{planDetails.dailyReturn}%</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="text-xs text-white/80">Duration</span>
                </div>
                <div className="text-lg font-bold">{planDetails.duration} days</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center mb-1">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span className="text-xs text-white/80">Min Amount</span>
                </div>
                <div className="text-sm font-bold">{formatCurrencyWithSettings(planDetails.minAmount, systemSettings)}</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center mb-1">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span className="text-xs text-white/80">Max Amount</span>
                </div>
                <div className="text-sm font-bold">
                  {planDetails.maxAmount ? formatCurrencyWithSettings(planDetails.maxAmount, systemSettings) : 'No limit'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3 pt-1">
              <div className="flex items-center text-white/90">
                <Shield className="w-3 h-3 mr-1" />
                <span className="text-xs">Secure Investment</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="flex items-center text-white/90">
                <Calculator className="w-3 h-3 mr-1" />
                <span className="text-xs">Guaranteed Returns</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Investment Amount Input */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-gray-100 pb-2">
            <CardTitle className="flex items-center text-gray-800 text-sm">
              <Calculator className="w-4 h-4 mr-2 text-green-500" />
              Investment Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div>
              <Label htmlFor="amount" className="text-gray-700 font-medium text-sm">Enter Amount ({systemSettings.currencySymbol})</Label>
              <div className="relative mt-1">
                <Input
                  id="amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => handleInvestmentAmountChange(e.target.value)}
                  placeholder={`Minimum ${formatCurrencyWithSettings(planDetails.minAmount, systemSettings)}`}
                  className="text-sm h-10 pl-10 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {investmentAmount && !isValidAmount() && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="w-3 h-3 mr-1">⚠️</span>
                  Amount must be between {formatCurrencyWithSettings(planDetails.minAmount, systemSettings)}
                  {planDetails.maxAmount && ` and ${formatCurrencyWithSettings(planDetails.maxAmount, systemSettings)}`}
                </p>
              )}
            </div>

            {/* Compact Investment Summary */}
            {investmentAmount && isValidAmount() && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center text-sm">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  Investment Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrencyWithSettings(calculateDailyProfit(), systemSettings)}
                    </div>
                    <span className="text-xs text-gray-600">Daily Profit</span>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrencyWithSettings(calculateTotalProfit(), systemSettings)}
                    </div>
                    <span className="text-xs text-gray-600">Total Profit</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white text-center">
                  <div className="text-xs opacity-90">Total Return After {planDetails.duration} Days</div>
                  <div className="text-xl font-bold">{formatCurrencyWithSettings(calculateTotalReturn(), systemSettings)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Payment Method Selection */}
        {investmentAmount && isValidAmount() && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100 pb-2">
              <CardTitle className="text-gray-800 text-sm">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Compact Balance Option */}
              <div 
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'balance' 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setPaymentMethod('balance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'balance' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Wallet className={`w-5 h-5 ${
                        paymentMethod === 'balance' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">Use Available Balance</h3>
                      <p className="text-xs text-gray-600">
                        Current Balance: {isLoadingBalance ? (
                          <span className="inline-block w-12 h-3 bg-gray-200 animate-pulse rounded"></span>
                        ) : (
                          formatCurrencyWithSettings(userBalance, systemSettings)
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isLoadingBalance && (
                      canInvestWithBalance() ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Available</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">Insufficient</Badge>
                      )
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                      paymentMethod === 'balance' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'balance' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Deposit Option */}
              <div 
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'deposit' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setPaymentMethod('deposit')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentMethod === 'deposit' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${
                        paymentMethod === 'deposit' ? 'text-emerald-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">Make New Deposit</h3>
                      <p className="text-xs text-gray-600">Deposit funds and invest immediately</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Available</Badge>
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                      paymentMethod === 'deposit' 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'deposit' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Proceed Button */}
        {investmentAmount && isValidAmount() && paymentMethod && (
          <div className="pb-4">
            <Button 
              onClick={handleProceed}
              disabled={isProcessing || isLoadingBalance}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : paymentMethod === 'balance' ? (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Invest Now
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Deposit
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Invest;
