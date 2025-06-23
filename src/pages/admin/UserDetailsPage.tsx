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
  TrendingDown
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useUserDetails } from '@/hooks/useUserDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import toastService from '@/services/toastService';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const UserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  // Validate userId immediately
  const isValidUserId = (id: string | undefined): boolean => {
    if (!id || id === 'undefined' || id === 'null' || id === '') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  useEffect(() => {
    if (!isValidUserId(userId)) {
      console.error('Invalid userId in UserDetailsPage:', userId);
      toastService.error('Invalid user ID. Redirecting to users list.');
      navigate('/admin/users');
    }
  }, [userId, navigate]);

  const { data: user, isLoading, error } = useUserDetails(userId);

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSettings(amount, currencySettings);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Early return for invalid userId
  if (!isValidUserId(userId)) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <h1 className="text-2xl font-bold mb-4">Invalid User ID</h1>
            <p className="mb-4">The user ID provided is not valid. Please check the URL and try again.</p>
            <Button asChild>
              <Link to="/admin/users">Back to Users</Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex flex-col space-y-4">
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link to="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
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
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="mb-4">
              {error?.message || 'The requested user could not be found. Please check the user ID and try again.'}
            </p>
            <Button variant="outline" asChild>
              <Link to="/admin/users">Back to Users</Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <Button variant="outline" size="sm" className="w-fit" asChild>
            <Link to="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">View detailed user information</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 w-fit" asChild>
            <Link to={`/admin/users/${userId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Link>
          </Button>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={user.profile_image_url} 
                  alt={user.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl bg-green-500 text-white">
                  {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                    <p className="text-gray-600">ID: {user.id}</p>
                  </div>
                  <Badge variant={user.account_status === 'active' ? 'default' : 'secondary'}>
                    {user.account_status}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{user.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{user.phone_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(user.available_balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Deposits</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(user.total_deposits)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Withdrawals</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(user.total_withdrawals)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Referrals</p>
                  <p className="text-lg font-semibold">{user.totalReferrals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-lg">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Address</label>
                    <p className="text-lg">{user.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <p className="text-lg">{user.phone_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Country</label>
                    <p className="text-lg">{user.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">KYC Status</label>
                    <Badge variant="default">{user.kyc_status?.replace('_', ' ') || 'Not submitted'}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Login</label>
                    <p className="text-lg">{formatDate(user.last_login_at)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-lg">{user.address || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.recentTransactions && user.recentTransactions.length > 0 ? (
                    user.recentTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'deposit' ? 'bg-green-100' :
                            transaction.type === 'withdrawal' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {transaction.type === 'deposit' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                             transaction.type === 'withdrawal' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                             <DollarSign className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{transaction.type}</p>
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
                    <p className="text-center text-gray-500 py-8">No recent activity found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default UserDetailsPage;
