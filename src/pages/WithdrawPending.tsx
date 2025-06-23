
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Home, RefreshCw, Wallet2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';

interface WithdrawalData {
  id: string;
  amount: number;
  withdrawal_method: string;
  transaction_id?: string;
  created_at: string;
  status: string;
  payment_gateways?: {
    name: string;
    gateway_type: string;
  };
}

const WithdrawPending = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [withdrawal, setWithdrawal] = useState<WithdrawalData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const withdrawalId = searchParams.get('withdrawalId');

  useEffect(() => {
    if (withdrawalId) {
      fetchWithdrawalDetails();
    } else {
      fetchLatestWithdrawal();
    }
  }, [withdrawalId, user]);

  const fetchWithdrawalDetails = async () => {
    if (!user || !withdrawalId) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          payment_gateways (
            name,
            gateway_type
          )
        `)
        .eq('id', withdrawalId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching withdrawal details:', error);
        return;
      }

      setWithdrawal(data);
    } catch (error) {
      console.error('Error in fetchWithdrawalDetails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestWithdrawal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          payment_gateways (
            name,
            gateway_type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest withdrawal:', error);
        return;
      }

      setWithdrawal(data);
    } catch (error) {
      console.error('Error in fetchLatestWithdrawal:', error);
    } finally {
      setLoading(false);
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

  if (!withdrawal) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">No pending withdrawal found</p>
            <Link to="/withdraw" className="text-emerald-600 hover:underline mt-2 block">
              Make a new withdrawal
            </Link>
          </div>
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
                  <h1 className="text-lg font-bold text-white">Withdrawal Status</h1>
                </div>
              </div>
            </div>
            
            {/* Compact Status */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 text-center">
              <Clock className="w-10 h-10 text-amber-200 mx-auto mb-2" />
              <h2 className="text-white text-lg font-bold mb-1">Withdrawal Pending</h2>
              <p className="text-emerald-100 text-xs">Your withdrawal is being processed by our team</p>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-3 space-y-4 -mt-2">
          {/* Status Card */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Withdrawal Submitted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-800 font-semibold mb-2 text-sm">What happens next?</p>
                <ul className="space-y-1.5 text-xs text-green-700">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Your withdrawal request has been submitted successfully
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Our team will process your request within 1-3 business days
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    You'll receive a notification once funds are transferred
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    The amount will be credited to your selected account
                  </li>
                </ul>
              </div>

              {/* Compact Transaction Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <h3 className="font-bold text-blue-800 mb-2 text-sm">Transaction Details</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Amount:</span>
                    <span className="font-bold text-blue-800">Rs. {withdrawal.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Method:</span>
                    <span className="font-bold text-blue-800">{withdrawal.payment_gateways?.name || withdrawal.withdrawal_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Processing Time:</span>
                    <span className="font-bold text-blue-800">1-3 business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Transaction ID:</span>
                    <span className="font-bold text-blue-800">#{withdrawal.transaction_id || withdrawal.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Date Submitted:</span>
                    <span className="font-bold text-blue-800">{new Date(withdrawal.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-blue-600" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="space-y-2 text-xs text-blue-800">
                  <div>
                    <p className="font-semibold">Processing Time:</p>
                    <p>Withdrawals are typically processed within 1-3 business days during business hours.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Track Your Withdrawal:</p>
                    <p>You can check the status of your withdrawal in the Withdrawal History section.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Need Help?</p>
                    <p>Contact our support team if you have any questions about your withdrawal.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Action Buttons */}
          <div className="space-y-2">
            <Link to="/" className="block">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 rounded-xl text-sm">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            
            <Link to="/withdraw-history" className="block">
              <Button 
                variant="outline" 
                className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold py-3 rounded-xl text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                View Withdrawal History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WithdrawPending;
