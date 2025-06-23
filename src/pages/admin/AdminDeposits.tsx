import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, XCircle, Clock, Filter, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  bank_details: string | null;
  screenshot_url: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  users: {
    full_name: string;
    username: string;
  } | null;
}

const AdminDeposits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approved' | 'rejected' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings: currencySettings } = useSystemSettings();

  // Determine status filter from URL
  const statusFromUrl = useMemo(() => {
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/approved')) return 'approved';
    if (location.pathname.includes('/rejected')) return 'rejected';
    return 'all';
  }, [location.pathname]);

  const fetchDeposits = async () => {
    try {
      let query = supabase
        .from('deposits')
        .select(`
          *,
          users!deposits_user_id_fkey(full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (statusFromUrl !== 'all') {
        query = query.eq('status', statusFromUrl);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deposits:', error);
        toast.error('Failed to fetch deposits');
        return;
      }

      setDeposits(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while fetching deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFromUrl]);

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.users?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStatusUpdate = async (depositId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setProcessing(depositId);
      setProcessingAction(newStatus);
      
      const deposit = deposits.find(d => d.id === depositId);
      if (!deposit) return;

      console.log('Processing deposit:', deposit);

      const { error: depositError } = await supabase
        .from('deposits')
        .update({ 
          status: newStatus,
          processed_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (depositError) {
        console.error('Error updating deposit:', depositError);
        toast.error('Failed to update deposit status');
        return;
      }

      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus === 'approved' ? 'completed' : 'failed'
        })
        .eq('reference_id', depositId)
        .eq('reference_type', 'deposit');

      if (transactionError) {
        console.error('Error updating transaction:', transactionError);
      }

      // If approved, update user balance and create investment if needed
      if (newStatus === 'approved') {
        // First get current user balance
        const { data: userData, error: userFetchError } = await supabase
          .from('users')
          .select('available_balance, total_deposits')
          .eq('id', deposit.user_id)
          .single();

        if (userFetchError) {
          console.error('Error fetching user data:', userFetchError);
          toast.error('Failed to fetch user balance');
          return;
        }

        // Update balance by adding deposit amount to existing balance
        const newBalance = (userData.available_balance || 0) + deposit.amount;
        const newTotalDeposits = (userData.total_deposits || 0) + deposit.amount;

        const { error: balanceError } = await supabase
          .from('users')
          .update({
            available_balance: newBalance,
            total_deposits: newTotalDeposits,
            updated_at: new Date().toISOString()
          })
          .eq('id', deposit.user_id);

        if (balanceError) {
          console.error('Error updating balance:', balanceError);
          toast.error('Failed to update user balance');
          return;
        }

        // Check if this is an investment deposit and create investment
        const isInvestmentDeposit = deposit.notes?.includes('Investment Plan:');
        if (isInvestmentDeposit) {
          console.log('Processing investment deposit:', deposit.notes);
          
          // Extract plan ID from notes
          const planIdMatch = deposit.notes.match(/ID: ([a-f0-9-]+)\)/);
          const planId = planIdMatch ? planIdMatch[1] : null;
          
          if (planId) {
            console.log('Creating investment for plan ID:', planId);
            
            // Get plan details to calculate end date
            const { data: planData, error: planError } = await supabase
              .from('investment_plans')
              .select('duration_days, name')
              .eq('id', planId)
              .single();

            if (planError) {
              console.error('Error fetching plan data:', planError);
              toast.error('Failed to fetch investment plan details');
              return;
            }

            // Calculate end date
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + planData.duration_days);

            // Deduct investment amount from balance since it's now invested
            const investmentBalance = newBalance - deposit.amount;
            const { error: deductError } = await supabase
              .from('users')
              .update({ 
                available_balance: investmentBalance,
                current_plan_id: planId,
                updated_at: new Date().toISOString()
              })
              .eq('id', deposit.user_id);

            if (deductError) {
              console.error('Error deducting investment amount:', deductError);
              toast.error('Failed to process investment amount');
              return;
            }

            // Create investment record
            const { error: investmentError } = await supabase
              .from('user_investments')
              .insert({
                user_id: deposit.user_id,
                investment_plan_id: planId,
                amount: deposit.amount,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                total_profit_earned: 0,
                last_profit_date: null
              });

            if (investmentError) {
              console.error('Error creating investment:', investmentError);
              // Rollback the balance deduction
              await supabase
                .from('users')
                .update({ 
                  available_balance: newBalance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', deposit.user_id);
              toast.error('Failed to create investment record');
              return;
            }

            console.log('Investment created successfully for plan:', planData.name);
            toast.success(`Investment plan "${planData.name}" activated successfully!`);
          } else {
            console.error('Could not extract plan ID from notes:', deposit.notes);
          }
        }
      } else if (newStatus === 'rejected') {
        // If rejected, make sure the balance is not updated
        console.log('Deposit rejected, no balance changes made');
      }

      toast.success(`Deposit ${newStatus} successfully`);
      fetchDeposits();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setProcessing(null);
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (depositId: string) => {
    navigate(`/admin/deposits/${depositId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (statusFromUrl) {
      case 'pending': return 'Pending Deposits';
      case 'approved': return 'Approved Deposits';
      case 'rejected': return 'Rejected Deposits';
      default: return 'All Deposits';
    }
  };

  const getDepositType = (notes: string | null) => {
    if (notes?.includes('Investment Plan:')) {
      const planMatch = notes.match(/Investment Plan: ([^(]+)/);
      return {
        type: 'Investment',
        planName: planMatch ? planMatch[1].trim() : 'Unknown Plan',
        icon: <TrendingUp className="w-4 h-4 text-blue-500" />
      };
    }
    return {
      type: 'Direct Deposit',
      planName: null,
      icon: <CreditCard className="w-4 h-4 text-gray-500" />
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading deposits...</div>
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
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor and manage deposit requests</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">{filteredDeposits.length}</span>
              <span>deposits found</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, deposit ID, or transaction ID..."
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
          {filteredDeposits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="text-gray-500 text-base sm:text-lg">
                No deposits found for the selected criteria.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mobile View */}
              <div className="block lg:hidden">
                {filteredDeposits.map((deposit) => {
                  const depositType = getDepositType(deposit.notes);
                  const isProcessing = processing === deposit.id;
                  return (
                    <div key={deposit.id} className="border-b border-gray-200 p-3 sm:p-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {deposit.users?.full_name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            @{deposit.users?.username}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusIcon(deposit.status)}
                          <span className={`px-2 py-1 rounded-full text-xs capitalize whitespace-nowrap ${
                            deposit.status === 'approved' 
                              ? 'bg-green-100 text-green-700'
                              : deposit.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {deposit.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs sm:text-sm">
                        <div>
                          <div className="text-gray-500">Amount</div>
                          <div className="font-bold text-green-600">
                            {formatCurrencyWithSettings(deposit.amount, currencySettings)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Method</div>
                          <div className="font-medium">{deposit.payment_method}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Type</div>
                          <div className="flex items-center space-x-1">
                            {depositType.icon}
                            <span className="text-xs sm:text-sm">{depositType.type}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Date</div>
                          <div className="text-xs sm:text-sm">
                            {new Date(deposit.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {deposit.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 flex-1 min-w-0 text-xs"
                              onClick={() => handleStatusUpdate(deposit.id, 'approved')}
                              disabled={isProcessing}
                            >
                              {isProcessing && processingAction === 'approved' ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex-1 min-w-0 text-xs"
                              onClick={() => handleStatusUpdate(deposit.id, 'rejected')}
                              disabled={isProcessing}
                            >
                              {isProcessing && processingAction === 'rejected' ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 min-w-0 text-xs"
                          onClick={() => handleViewDetails(deposit.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Deposit ID</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">User</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Method</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Date</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-sm text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDeposits.map((deposit) => {
                      const depositType = getDepositType(deposit.notes);
                      const isProcessing = processing === deposit.id;
                      return (
                        <tr key={deposit.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="font-medium text-sm">{deposit.id.slice(0, 8)}...</div>
                            {deposit.transaction_id && (
                              <div className="text-xs text-gray-500 mt-1">{deposit.transaction_id}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-sm">{deposit.users?.full_name}</div>
                            <div className="text-xs text-gray-500">@{deposit.users?.username}</div>
                          </td>
                          <td className="py-4 px-6 font-bold text-green-600">
                            {formatCurrencyWithSettings(deposit.amount, currencySettings)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {depositType.icon}
                              <div>
                                <div className="font-medium text-sm">{depositType.type}</div>
                                {depositType.planName && (
                                  <div className="text-xs text-blue-600">{depositType.planName}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">{deposit.payment_method}</td>
                          <td className="py-4 px-6 text-sm">
                            {new Date(deposit.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(deposit.status)}
                              <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                                deposit.status === 'approved' 
                                  ? 'bg-green-100 text-green-700'
                                  : deposit.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {deposit.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              {deposit.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleStatusUpdate(deposit.id, 'approved')}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing && processingAction === 'approved' ? 'Approving...' : 'Approve'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleStatusUpdate(deposit.id, 'rejected')}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing && processingAction === 'rejected' ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(deposit.id)}
                              >
                                View Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default AdminDeposits;
