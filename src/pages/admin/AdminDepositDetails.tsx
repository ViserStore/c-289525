import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, CreditCard, Calendar, Hash, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { processDepositApproval } from '@/utils/depositProcessor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

interface DepositData {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  transaction_id?: string;
  screenshot_url?: string;
  notes?: string;
  users?: {
    full_name: string;
    email: string;
    phone_number: string;
  };
}

const AdminDepositDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deposit, setDeposit] = useState<DepositData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  useEffect(() => {
    if (id) {
      fetchDeposit();
    }
  }, [id]);

  const fetchDeposit = async () => {
    try {
      setLoading(true);
      console.log('Fetching deposit with ID:', id);
      
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          users!deposits_user_id_fkey (
            full_name,
            email,
            phone_number
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching deposit:', error);
        toast.error('Failed to load deposit details');
        return;
      }

      console.log('Fetched deposit data:', data);
      setDeposit(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load deposit details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!deposit) return;

    setProcessing(newStatus);
    try {
      if (newStatus === 'approved') {
        // Use the deposit processor for approvals
        await handleApprove();
      } else {
        // Handle rejection
        const { error } = await supabase
          .from('deposits')
          .update({ 
            status: newStatus,
            processed_at: new Date().toISOString()
          })
          .eq('id', deposit.id);

        if (error) {
          console.error('Error updating deposit status:', error);
          toast.error('Failed to update deposit status');
          return;
        }

        toast.success(`Deposit ${newStatus} successfully`);
        setDeposit({ ...deposit, status: newStatus });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update deposit status');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async () => {
    if (!deposit) return;
    
    setProcessing('approved');
    try {
      console.log('🔄 Starting deposit approval process...');
      
      // First update the deposit status to trigger the database trigger
      const { error: statusError } = await supabase
        .from('deposits')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', deposit.id);

      if (statusError) {
        console.error('❌ Error updating deposit status:', statusError);
        throw new Error(`Failed to update deposit status: ${statusError.message}`);
      }

      // Process the deposit approval (balance update, transaction record)
      const result = await processDepositApproval(deposit.id, deposit.user_id, deposit.amount);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to process deposit approval');
      }

      console.log('✅ Deposit approval completed successfully');
      toast.success(
        'Deposit approved successfully! User balance updated and referral commissions processed automatically.',
        { duration: 5000 }
      );
      
      setDeposit({ ...deposit, status: 'approved' });
      
    } catch (error) {
      console.error('❌ Error approving deposit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to approve deposit: ${errorMessage}`);
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

  if (!deposit) {
    return (
      <AdminLayout>
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Not Found</h2>
            <p className="text-gray-600 mb-4">The deposit you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/admin/deposits')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deposits
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
              <Button variant="outline" onClick={() => navigate('/admin/deposits')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Deposit Details</h1>
                <p className="text-gray-600 text-sm sm:text-base">View and manage deposit request</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            {deposit && deposit.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  variant="destructive"
                  disabled={processing !== null}
                  className="flex items-center"
                >
                  {processing === 'rejected' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === 'rejected' ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                  disabled={processing !== null}
                >
                  {processing === 'approved' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === 'approved' ? 'Approving & Processing...' : 'Approve'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Success Message for Approved Deposits */}
        {deposit && deposit.status === 'approved' && (
          <div className="px-2 sm:px-4 lg:px-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Deposit Approved</h3>
                  <p className="text-sm text-green-700 mt-1">
                    This deposit has been approved. User balance updated and referral commissions processed automatically by the database trigger.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>Transaction Information</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(deposit.status)}
                      <Badge variant={deposit.status === 'approved' ? 'default' : deposit.status === 'pending' ? 'secondary' : 'destructive'}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Deposit ID</label>
                      <p className="font-medium break-all">{deposit.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Transaction ID</label>
                      <p className="font-medium break-all">{deposit.transaction_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Amount</label>
                      <p className="font-bold text-green-600 text-lg">{formatCurrencyWithSettings(deposit.amount, currencySettings)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Payment Method</label>
                      <p className="font-medium">{deposit.payment_method}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Date & Time</label>
                      <p className="font-medium">{new Date(deposit.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <p className="font-medium capitalize">{deposit.status}</p>
                    </div>
                  </div>
                  {deposit.notes && (
                    <div>
                      <label className="text-sm text-gray-500">Notes</label>
                      <p className="font-medium break-words">{deposit.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Screenshot */}
              {deposit.screenshot_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileImage className="w-5 h-5 mr-2" />
                      Payment Screenshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={deposit.screenshot_url} 
                        alt="Payment Screenshot" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => window.open(deposit.screenshot_url, '_blank')}
                      />
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Click to view full size
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* User Info Only */}
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
                    <p className="font-medium">{deposit.users?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium break-all">{deposit.users?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{deposit.users?.phone_number || 'N/A'}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/admin/users/${deposit.user_id}`)}
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
    case 'approved':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

export default AdminDepositDetails;
