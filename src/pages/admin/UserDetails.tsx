import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Edit, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useUserDetails } from '@/hooks/useUserDetails';
import { Skeleton } from '@/components/ui/skeleton';
import toastService from '@/services/toastService';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const UserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useUserDetails(userId || '');
  const { settings: currencySettings, loading: systemSettingsLoading } = useSystemSettings();

  // Validate userId parameter
  React.useEffect(() => {
    console.log('UserDetails - userId from params:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid userId detected:', userId);
      toastService.error("Invalid user ID. Redirecting to users list.");
      navigate('/admin/users');
    }
  }, [userId, navigate]);

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSettings(amount, currencySettings);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!userId || userId === 'undefined') {
    return (
      <AdminLayout>
        <div className="px-2 sm:px-4 lg:px-6 py-4">
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
        <div className="min-h-screen bg-gray-50">
          <div className="px-2 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
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
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <div className="text-center text-red-600">
            <p>Error loading user details. Please try again.</p>
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/users">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Link>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Details</h1>
                <p className="text-gray-600 text-sm sm:text-base">View user information and activity</p>
              </div>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10" asChild>
              <Link to={`/admin/users/${userId}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-2 sm:px-4 lg:px-6 py-6 space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                  <AvatarImage src={user.profile_image_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg sm:text-xl">{user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{user.full_name}</h2>
                      <p className="text-gray-600 text-sm">ID: {user.id}</p>
                    </div>
                    <Badge variant={user.account_status === 'active' ? 'default' : 'secondary'} className="text-sm mx-auto sm:mx-0">
                      {user.account_status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{user.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{user.phone_number}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    <DollarSign className="w-5 h-5 text-blue-600" />
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
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Withdrawals</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(user.total_withdrawals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Information */}
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
                  <p className="text-lg">{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserDetails;
