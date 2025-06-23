import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Shield
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useUserDetails } from '@/hooks/useUserDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import toastService from '@/services/toastService';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminUserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { settings: systemSettings, loading: systemSettingsLoading } = useSystemSettings();

  console.log('AdminUserDetails - userId from params:', userId);
  console.log('AdminUserDetails - userId type:', typeof userId);

  const isValidUserId = (id: string | undefined): boolean => {
    if (!id) return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  useEffect(() => {
    console.log('AdminUserDetails useEffect - checking userId:', userId);
    if (!isValidUserId(userId)) {
      console.error('Invalid userId in AdminUserDetails:', userId);
      toastService.error("Invalid user ID. Redirecting to users list.");
      navigate('/admin/users');
    }
  }, [userId, navigate]);

  const { data: user, isLoading, error } = useUserDetails(userId);

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSettings(amount, systemSettings);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'secondary';
      case 'banned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Early return if userId is invalid
  if (!isValidUserId(userId)) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>Invalid user ID. Redirecting...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50/30">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/users">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Link>
              </Button>
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading user details: {error?.message || 'User not found'}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/admin/users">Back to Users</Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50/30">
        {/* Header */}
        <div className="bg-white border-b border-gray-200/60 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/users">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Details</h1>
                  <p className="text-gray-600 text-sm sm:text-base">View detailed user information</p>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm" asChild>
                <Link to={`/admin/users/${userId}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* User Profile Row */}
          <Card className="shadow-sm border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* User Avatar */}
                <div className="flex flex-col items-center">
                  <Avatar className="w-24 h-24 shadow-md mb-4">
                    <AvatarImage src={user.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h2>
                    <Badge 
                      variant={getStatusBadgeVariant(user.account_status)} 
                      className="text-sm px-3 py-1 font-medium mb-2"
                    >
                      {user.account_status?.toUpperCase()}
                    </Badge>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(user.kyc_status)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      KYC: {user.kyc_status?.replace('_', ' ').toUpperCase() || 'NOT SUBMITTED'}
                    </div>
                  </div>
                </div>

                {/* User Details in Rows */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-sm text-gray-900">{user.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Phone</p>
                          <p className="text-sm text-gray-900">{user.phone_number}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Country</p>
                          <p className="text-sm text-gray-900">{user.country}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Joined</p>
                          <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Login</p>
                          <p className="text-sm text-gray-900">{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Referrals</p>
                          <p className="text-sm text-gray-900">{user.totalReferrals || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Row */}
                  {user.address && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Address</p>
                          <p className="text-sm text-gray-900">{user.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Balance</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(user.available_balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(user.total_deposits)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(user.total_withdrawals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(user.total_deposits - user.total_withdrawals)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="investments">Investments</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.recentTransactions && user.recentTransactions.length > 0 ? (
                      user.recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.type === 'Deposit' ? 'bg-green-100' :
                              transaction.type === 'Withdrawal' ? 'bg-red-100' :
                              'bg-blue-100'
                            }`}>
                              {transaction.type === 'Deposit' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                               transaction.type === 'Withdrawal' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                               <DollarSign className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.type}</p>
                              <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                            <Badge variant={
                              transaction.status === 'completed' || transaction.status === 'approved' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No recent transactions found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investments">
              <Card>
                <CardHeader>
                  <CardTitle>Investment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.investmentHistory && user.investmentHistory.length > 0 ? (
                      user.investmentHistory.map((investment) => (
                        <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{investment.investment_plans?.name || 'Investment Plan'}</p>
                            <p className="text-sm text-gray-500">Started: {formatDate(investment.start_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(investment.amount)}</p>
                            <p className="text-sm text-green-600">+{formatCurrency(investment.total_profit_earned)}</p>
                            <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                              {investment.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No investment history found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Referral Code</label>
                      <p className="text-lg font-mono">{user.referral_code || 'Not generated'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Referred By</label>
                      <p className="text-lg">{user.referred_by_user_id ? 'Yes' : 'None'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Total Referrals</label>
                      <p className="text-lg font-semibold">{user.totalReferrals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
