import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, CreditCard, Calendar, Hash, Building2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminWithdrawalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  useEffect(() => {
    if (id) {
      fetchWithdrawalDetails();
    }
  }, [id]);

  const fetchWithdrawalDetails = async () => {
    try {
      console.log('Fetching withdrawal details for ID:', id);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users!withdrawals_user_id_fkey (
            id,
            full_name,
            email,
            phone_number,
            available_balance,
            total_withdrawals
          ),
          payment_gateways (
            name,
            gateway_type
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching withdrawal:', error);
        toast.error('Failed to load withdrawal details');
        return;
      }

      console.log('Fetched withdrawal data:', data);
      setWithdrawal(data);
    } catch (error) {
      console.error('Error in fetchWithdrawalDetails:', error);
      toast.error('Failed to load withdrawal details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !withdrawal) {
      toast.error('Withdrawal ID not found');
      return;
    }

    setProcessing(newStatus);

    try {
      console.log(`Updating withdrawal ${id} to status: ${newStatus}`);

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating withdrawal status:', updateError);
        toast.error('Failed to update withdrawal status');
        return;
      }

      // Update transaction history status
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('reference_id', id)
        .eq('reference_type', 'withdrawal');

      if (transactionUpdateError) {
        console.error('Error updating transaction status:', transactionUpdateError);
        console.warn('Transaction status update failed, but withdrawal status was updated');
      }

      // Handle balance updates based on status
      if (newStatus === 'completed') {
        // For approval: Deduct amount from user balance (withdrawal was already pending)
        const currentBalance = withdrawal.users?.available_balance || 0;
        const newBalance = currentBalance - withdrawal.amount;

        if (newBalance < 0) {
          toast.error('User has insufficient balance for this withdrawal');
          
          // Revert the withdrawal status back to pending
          await supabase
            .from('withdrawals')
            .update({ 
              status: 'pending',
              processed_at: null 
            })
            .eq('id', id);
          
          return;
        }

        // Update user's balance
        const { error: balanceUpdateError } = await supabase
          .from('users')
          .update({ 
            available_balance: newBalance,
            total_withdrawals: (withdrawal.users?.total_withdrawals || 0) + withdrawal.amount
          })
          .eq('id', withdrawal.user_id);

        if (balanceUpdateError) {
          console.error('Error updating user balance:', balanceUpdateError);
          toast.error('Failed to update user balance');
          
          // Revert the withdrawal status
          await supabase
            .from('withdrawals')
            .update({ 
              status: 'pending',
              processed_at: null 
            })
            .eq('id', id);
          
          return;
        }

        // Create a completed transaction record
        const { error: balanceTransactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_completed',
            amount: -withdrawal.amount,
            description: `Withdrawal approved - ${withdrawal.withdrawal_method}`,
            status: 'completed',
            reference_type: 'withdrawal',
            reference_id: id
          });

        if (balanceTransactionError) {
          console.error('Error creating balance transaction:', balanceTransactionError);
          console.warn('Balance transaction creation failed, but withdrawal was processed');
        }

        toast.success('Withdrawal approved and user balance updated successfully!');
      } else if (newStatus === 'failed') {
        // For rejection: Return money to user balance
        const currentBalance = withdrawal.users?.available_balance || 0;
        const newBalance = currentBalance + withdrawal.amount;

        // Update user's balance (return the money)
        const { error: balanceUpdateError } = await supabase
          .from('users')
          .update({ 
            available_balance: newBalance
          })
          .eq('id', withdrawal.user_id);

        if (balanceUpdateError) {
          console.error('Error updating user balance:', balanceUpdateError);
          toast.error('Failed to return money to user balance');
          return;
        }

        // Create a transaction record for the money return
        const { error: returnTransactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_rejected',
            amount: withdrawal.amount,
            description: `Withdrawal rejected - Amount returned to balance`,
            status: 'completed',
            reference_type: 'withdrawal',
            reference_id: id
          });

        if (returnTransactionError) {
          console.error('Error creating return transaction:', returnTransactionError);
          console.warn('Return transaction creation failed, but money was returned');
        }

        toast.success('Withdrawal rejected and amount returned to user balance!');
      }

      // Refresh withdrawal data
      await fetchWithdrawalDetails();
      
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
      toast.error('Failed to process withdrawal request');
    } finally {
      setProcessing(null);
    }
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

  if (!withdrawal) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Withdrawal not found</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/withdrawals')}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Withdrawals
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/admin/withdrawals')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawal Details</h1>
                <p className="text-gray-600 text-sm sm:text-base">View and manage withdrawal request</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            {withdrawal && withdrawal.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleStatusUpdate('failed')}
                  variant="destructive"
                  disabled={processing !== null}
                  className="flex items-center"
                >
                  {processing === 'failed' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === 'failed' ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                  disabled={processing !== null}
                >
                  {processing === 'completed' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === 'completed' ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>Transaction Information</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(withdrawal.status)}
                      <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'pending' ? 'secondary' : 'destructive'}>
                        {withdrawal.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Withdrawal ID</label>
                      <p className="font-medium break-all">{withdrawal.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Transaction ID</label>
                      <p className="font-medium break-all">{withdrawal.transaction_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Requested Amount</label>
                      <p className="font-bold text-red-600 text-lg">{formatCurrencyWithSettings(withdrawal.amount, currencySettings)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Payment Method</label>
                      <p className="font-medium">{withdrawal.withdrawal_method}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Date & Time</label>
                      <p className="font-medium">{new Date(withdrawal.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">User Balance</label>
                      <p className="font-medium text-green-600">{formatCurrencyWithSettings(withdrawal.users?.available_balance || 0, currencySettings)}</p>
                    </div>
                  </div>
                  {withdrawal.admin_notes && (
                    <div>
                      <label className="text-sm text-gray-500">Admin Notes</label>
                      <p className="font-medium break-words">{withdrawal.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Account Details */}
              {withdrawal.account_details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Bank Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-3 font-medium">
                        {withdrawal.account_details?.instructions}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-gray-500 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Account Holder Name
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(withdrawal.account_details?.bank_account_details?.account_holder_name, 'Account holder name')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-bold text-gray-800">{withdrawal.account_details?.bank_account_details?.account_holder_name}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-gray-500 flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              Bank Name
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(withdrawal.account_details?.bank_account_details?.bank_name, 'Bank name')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-bold text-gray-800">{withdrawal.account_details?.bank_account_details?.bank_name}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-gray-500 flex items-center">
                              <Hash className="w-4 h-4 mr-1" />
                              Account Number
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(withdrawal.account_details?.bank_account_details?.account_number, 'Account number')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-bold text-gray-800">{withdrawal.account_details?.bank_account_details?.account_number}</p>
                        </div>
                        {withdrawal.account_details?.bank_account_details?.iban && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-sm text-gray-500 flex items-center">
                                <CreditCard className="w-4 h-4 mr-1" />
                                IBAN
                              </label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(withdrawal.account_details?.bank_account_details?.iban, 'IBAN')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-gray-800">{withdrawal.account_details?.bank_account_details?.iban}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Withdrawal Request Submitted</p>
                        <p className="text-sm text-gray-500">{new Date(withdrawal.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Under Review</p>
                          <p className="text-sm text-gray-500">Awaiting admin approval</p>
                        </div>
                      </div>
                    )}
                    {withdrawal.processed_at && (
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${withdrawal.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-medium">
                            {withdrawal.status === 'completed' ? 'Approved & Processed' : 'Rejected'}
                          </p>
                          <p className="text-sm text-gray-500">{new Date(withdrawal.processed_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Info */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium">{withdrawal.users?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium break-all">{withdrawal.users?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{withdrawal.users?.phone_number}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">User ID</label>
                    <p className="font-medium text-xs break-all">{withdrawal.user_id}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/admin/users/${withdrawal.user_id}`)}
                  >
                    View User Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

export default AdminWithdrawalDetails;
