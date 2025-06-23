
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Info, DollarSign, Building, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toastService from '@/services/toastService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithSettings } from '../lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import AppLayout from '../components/AppLayout';

interface PaymentGateway {
  id: string;
  name: string;
  minimum_amount: number;
  maximum_amount: number;
  fees_percentage: number;
  fees_fixed: number;
  gateway_type: string;
  is_active: boolean;
}

const Deposit = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState('');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();

  // Get URL parameters for investment flow
  const urlAmount = searchParams.get('amount');
  const planId = searchParams.get('planId');
  const planName = searchParams.get('planName');
  const isFromInvestment = Boolean(planId && planName);

  useEffect(() => {
    fetchPaymentGateways();
    
    // Pre-fill amount if coming from investment
    if (urlAmount) {
      setAmount(urlAmount);
    }
  }, [urlAmount]);

  const fetchPaymentGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('type', 'deposit')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setGateways(data || []);
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      toastService.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const getGatewayIcon = (gatewayType: string) => {
    switch (gatewayType.toLowerCase()) {
      case 'bank':
        return <Building className="w-6 h-6" />;
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'card':
        return <CreditCard className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const calculateFees = (gateway: PaymentGateway, depositAmount: number) => {
    const percentageFee = (depositAmount * gateway.fees_percentage) / 100;
    const totalFees = percentageFee + gateway.fees_fixed;
    return totalFees;
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toastService.error('Please enter a valid amount');
      return;
    }

    if (!selectedGateway) {
      toastService.error('Please select a payment method');
      return;
    }

    const gateway = gateways.find(g => g.id === selectedGateway);
    if (!gateway) {
      toastService.error('Invalid payment method selected');
      return;
    }

    const depositAmount = parseFloat(amount);
    
    if (depositAmount < gateway.minimum_amount) {
      toastService.error(`Minimum deposit amount is ${formatCurrencyWithSettings(gateway.minimum_amount, systemSettings)}`);
      return;
    }

    if (gateway.maximum_amount && depositAmount > gateway.maximum_amount) {
      toastService.error(`Maximum deposit amount is ${formatCurrencyWithSettings(gateway.maximum_amount, systemSettings)}`);
      return;
    }

    // Navigate to deposit details page with properly formatted query parameters
    const queryParams = new URLSearchParams({
      gateway: selectedGateway,
      amount: amount
    });
    
    // Add investment-related parameters if coming from investment
    if (planId) queryParams.set('planId', planId);
    if (planName) queryParams.set('planName', planName);
    
    navigate(`/deposit-details?${queryParams.toString()}`);
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-3 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Link 
                to={isFromInvestment ? "/invest" : "/"} 
                className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <h1 className="text-lg font-bold text-white">
                {isFromInvestment ? `Deposit for ${planName}` : 'Deposit Funds'}
              </h1>
            </div>
            <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Compact Balance Card */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
            <div className="text-center">
              <p className="text-emerald-100 text-xs">Current Balance</p>
              <p className="text-white text-xl font-bold">
                {formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}
              </p>
              {isFromInvestment && (
                <p className="text-emerald-100 text-xs mt-1">
                  Investment Amount: {formatCurrencyWithSettings(parseFloat(amount || '0'), systemSettings)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-3 space-y-4">
          {/* Investment Info Card (if from investment) */}
          {isFromInvestment && (
            <Card className="border-0 shadow-lg bg-white rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-800 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-600" />
                  Investment Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    You're making a deposit for the <strong>{planName}</strong> investment plan.
                    After your deposit is approved, your investment will be automatically activated.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact Amount Input */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                Deposit Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Input
                  type="number"
                  placeholder={`Enter amount (${systemSettings.currencySymbol})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold text-center border-2 border-emerald-200 focus:border-emerald-500 rounded-lg h-11"
                  disabled={isFromInvestment}
                />
                {isFromInvestment && (
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Amount is pre-filled for your investment plan
                  </p>
                )}
              </div>
              
              {/* Compact Quick Amount Buttons */}
              {!isFromInvestment && (
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs h-8"
                    >
                      {formatCurrencyWithSettings(quickAmount, systemSettings)}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Payment Methods */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">Loading payment methods...</p>
                </div>
              ) : gateways.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">No payment methods available</p>
                </div>
              ) : (
                gateways.map((gateway) => {
                  const depositAmount = parseFloat(amount) || 0;
                  const fees = calculateFees(gateway, depositAmount);
                  const totalAmount = depositAmount + fees;

                  return (
                    <div
                      key={gateway.id}
                      onClick={() => setSelectedGateway(gateway.id)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedGateway === gateway.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded ${
                            selectedGateway === gateway.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getGatewayIcon(gateway.gateway_type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm">{gateway.name}</h3>
                            <p className="text-xs text-gray-600">
                              Min: {formatCurrencyWithSettings(gateway.minimum_amount, systemSettings)}
                              {gateway.maximum_amount && ` - Max: ${formatCurrencyWithSettings(gateway.maximum_amount, systemSettings)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {depositAmount > 0 && (
                            <>
                              <p className="text-xs text-gray-600">Fee: {formatCurrencyWithSettings(fees, systemSettings)}</p>
                              <p className="font-semibold text-emerald-600 text-sm">
                                Total: {formatCurrencyWithSettings(totalAmount, systemSettings)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Compact Information Card */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <ul className="space-y-1 text-xs text-blue-800">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Deposits are processed within 2-24 hours
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Please ensure you follow payment instructions carefully
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Upload clear screenshots for faster verification
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Contact support if you need assistance
                  </li>
                  {isFromInvestment && (
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      Your investment will be activated after deposit approval
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Compact Proceed Button */}
          <Button
            onClick={handleProceed}
            disabled={!amount || !selectedGateway}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 rounded-xl"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Deposit;
