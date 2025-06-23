import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, XCircle, Clock, Filter, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminWithdrawals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  // Determine status filter from URL
  const statusFromUrl = useMemo(() => {
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/approved')) return 'completed';
    if (location.pathname.includes('/rejected')) return 'failed';
    return 'all';
  }, [location.pathname]);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFromUrl]);

  const fetchWithdrawals = async () => {
    try {
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (statusFromUrl !== 'all') {
        query = query.eq('status', statusFromUrl);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching withdrawals:', error);
        toast.error('Failed to load withdrawals');
        return;
      }

      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error in fetchWithdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStatusUpdate = async (withdrawalId: string, newStatus: string) => {
    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) {
      toast.error('Withdrawal not found');
      return;
    }

    setProcessing(withdrawalId);

    try {
      console.log(`Updating withdrawal ${withdrawalId} to status: ${newStatus}`);

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error updating withdrawal status:', updateError);
        toast.error('Failed to update withdrawal status');
        return;
      }

      // Update transaction history status
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('reference_id', withdrawalId)
        .eq('reference_type', 'withdrawal');

      if (transactionUpdateError) {
        console.error('Error updating transaction status:', transactionUpdateError);
        console.warn('Transaction status update failed, but withdrawal status was updated');
      }

      // Handle balance updates based on status
      if (newStatus === 'completed') {
        // For approval: Deduct amount from user balance
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
            .eq('id', withdrawalId);
          
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
            .eq('id', withdrawalId);
          
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
            reference_id: withdrawalId
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
            reference_id: withdrawalId
          });

        if (returnTransactionError) {
          console.error('Error creating return transaction:', returnTransactionError);
          console.warn('Return transaction creation failed, but money was returned');
        }

        toast.success('Withdrawal rejected and amount returned to user balance!');
      }

      // Refresh the withdrawals list
      await fetchWithdrawals();
      
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
      toast.error('Failed to process withdrawal request');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDetails = (withdrawalId: string) => {
    console.log('Navigating to withdrawal details:', withdrawalId);
    navigate(`/admin/withdrawals/${withdrawalId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (statusFromUrl) {
      case 'pending': return 'Pending Withdrawals';
      case 'completed': return 'Approved Withdrawals';
      case 'failed': return 'Rejected Withdrawals';
      default: return 'All Withdrawals';
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor and manage withdrawal requests</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">{filteredWithdrawals.length}</span>
              <span>withdrawals found</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, withdrawal ID, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Button variant="outline" className="h-10">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-2 sm:px-4 lg:px-6 py-6">
          {filteredWithdrawals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="text-gray-500 text-base sm:text-lg">
                No withdrawals found for the selected criteria.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile View */}
              <div className="block lg:hidden">
                {filteredWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border-b border-gray-200 p-3 sm:p-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {withdrawal.users?.full_name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {withdrawal.withdrawal_method}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-2 py-1 rounded-full text-xs capitalize whitespace-nowrap ${
                          withdrawal.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : withdrawal.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs sm:text-sm">
                      <div>
                        <div className="text-gray-500">Amount</div>
                        <div className="font-bold text-red-600">
                          {formatCurrencyWithSettings(withdrawal.amount, currencySettings)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Bank</div>
                        <div className="font-medium">{withdrawal.account_details?.bank_account_details?.bank_name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Account</div>
                        <div className="text-xs sm:text-sm">
                          ****{withdrawal.account_details?.bank_account_details?.account_number?.slice(-4) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Date</div>
                        <div className="text-xs sm:text-sm">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 flex-1 min-w-0 text-xs"
                            onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                            disabled={processing === withdrawal.id}
                          >
                            {processing === withdrawal.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="flex-1 min-w-0 text-xs"
                            onClick={() => handleStatusUpdate(withdrawal.id, 'failed')}
                            disabled={processing === withdrawal.id}
                          >
                            {processing === withdrawal.id ? 'Processing...' : 'Reject'}
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 min-w-0 text-xs"
                        onClick={() => handleViewDetails(withdrawal.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Withdrawal ID</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">User</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Account Details</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Date</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-sm">{withdrawal.id.slice(0, 8)}...</div>
                          <div className="text-xs text-gray-500 mt-1">{withdrawal.transaction_id || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-sm">{withdrawal.users?.full_name}</div>
                          <div className="text-xs text-gray-500">{withdrawal.withdrawal_method}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-red-600">
                          {formatCurrencyWithSettings(withdrawal.amount, currencySettings)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div className="font-medium">{withdrawal.account_details?.bank_account_details?.account_holder_name}</div>
                            <div className="text-gray-500">{withdrawal.account_details?.bank_account_details?.bank_name}</div>
                            <div className="text-gray-500">****{withdrawal.account_details?.bank_account_details?.account_number?.slice(-4)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                              withdrawal.status === 'completed' 
                                ? 'bg-green-100 text-green-700'
                                : withdrawal.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {withdrawal.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            {withdrawal.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                                  disabled={processing === withdrawal.id}
                                >
                                  {processing === withdrawal.id ? 'Processing...' : 'Approve'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleStatusUpdate(withdrawal.id, 'failed')}
                                  disabled={processing === withdrawal.id}
                                >
                                  {processing === withdrawal.id ? 'Processing...' : 'Reject'}
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(withdrawal.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
