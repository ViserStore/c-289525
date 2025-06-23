import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowDownLeft, ArrowUpRight, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, UserPlus, Target, CreditCard, Banknote } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useAdminDashboard();
  const { settings: systemSettings, loading: systemSettingsLoading } = useSystemSettings();

  const StatCard = ({ stat, isToday = false }: { stat: any, isToday?: boolean }) => {
    const Icon = stat.icon;
    const isPositiveChange = stat.change?.includes('+');
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {stat.title}
          </CardTitle>
          <Icon className={`w-4 h-4 ${isToday ? 'text-blue-500' : 'text-gray-400'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs">
              {isPositiveChange ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={isPositiveChange ? 'text-green-600' : 'text-red-600'}>
                {stat.change}
              </span>
              <span className="text-gray-500">vs yesterday</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="px-2 sm:px-4 lg:px-6 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm sm:text-base">Welcome to the admin dashboard</p>
          </div>

          {/* Loading skeletons */}
          <div className="px-2 sm:px-4 lg:px-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Today's Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <div className="text-center text-red-600">
            <p>Error loading dashboard data. Please try again.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Today's Statistics with real data using enhanced currency formatting
  const todayStats = [
    {
      title: "Today's Deposits",
      value: formatCurrencyWithSettings(stats?.todayDeposits.amount || 0, systemSettings),
      icon: ArrowDownLeft,
      change: stats?.todayDeposits.change || '+0%',
      changeType: stats?.todayDeposits.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.todayDeposits.count || 0} transactions`,
    },
    {
      title: "Today's Withdrawals",
      value: formatCurrencyWithSettings(stats?.todayWithdrawals.amount || 0, systemSettings),
      icon: ArrowUpRight,
      change: stats?.todayWithdrawals.change || '+0%',
      changeType: stats?.todayWithdrawals.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.todayWithdrawals.count || 0} transactions`,
    },
    {
      title: "Today's New Users",
      value: stats?.todayNewUsers.count?.toString() || '0',
      icon: UserPlus,
      change: stats?.todayNewUsers.change || '+0%',
      changeType: stats?.todayNewUsers.change?.includes('+') ? 'increase' : 'decrease',
      description: 'New registrations',
    },
    {
      title: "Today's Active Plans",
      value: stats?.todayActivePlans.count?.toString() || '0',
      icon: Target,
      change: stats?.todayActivePlans.change || '+0%',
      changeType: stats?.todayActivePlans.change?.includes('+') ? 'increase' : 'decrease',
      description: 'Plans activated',
    },
  ];

  // Overall Statistics with real data using enhanced currency formatting
  const overallStats = [
    {
      title: 'Total Users',
      value: stats?.totalUsers.count?.toLocaleString() || '0',
      icon: Users,
      change: stats?.totalUsers.change || '+0%',
      changeType: stats?.totalUsers.change?.includes('+') ? 'increase' : 'decrease',
      description: 'Registered users',
    },
    {
      title: 'Active Users with Plans',
      value: stats?.activeUsersWithPlans.count?.toLocaleString() || '0',
      icon: CheckCircle,
      change: stats?.activeUsersWithPlans.change || '+0%',
      changeType: stats?.activeUsersWithPlans.change?.includes('+') ? 'increase' : 'decrease',
      description: 'Users with active plans',
    },
    {
      title: 'Pending Deposits',
      value: formatCurrencyWithSettings(stats?.pendingDeposits.amount || 0, systemSettings),
      icon: Clock,
      change: stats?.pendingDeposits.change || '+0%',
      changeType: stats?.pendingDeposits.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.pendingDeposits.count || 0} pending requests`,
    },
    {
      title: 'Pending Withdrawals',
      value: formatCurrencyWithSettings(stats?.pendingWithdrawals.amount || 0, systemSettings),
      icon: Clock,
      change: stats?.pendingWithdrawals.change || '+0%',
      changeType: stats?.pendingWithdrawals.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.pendingWithdrawals.count || 0} pending requests`,
    },
  ];

  // Financial Summary Statistics using enhanced currency formatting
  const financialStats = [
    {
      title: 'Total Deposits',
      value: formatCurrencyWithSettings(stats?.totalDeposits?.amount || 0, systemSettings),
      icon: CreditCard,
      change: stats?.totalDeposits?.change || '+0%',
      changeType: stats?.totalDeposits?.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.totalDeposits?.count || 0} total transactions`,
    },
    {
      title: 'Total Withdrawals', 
      value: formatCurrencyWithSettings(stats?.totalWithdrawals?.amount || 0, systemSettings),
      icon: Banknote,
      change: stats?.totalWithdrawals?.change || '+0%',
      changeType: stats?.totalWithdrawals?.change?.includes('+') ? 'increase' : 'decrease',
      description: `${stats?.totalWithdrawals?.count || 0} total transactions`,
    },
    {
      title: 'Total Deposit Charges',
      value: formatCurrencyWithSettings(stats?.totalDepositCharges?.amount || 0, systemSettings),
      icon: DollarSign,
      change: stats?.totalDepositCharges?.change || '+0%',
      changeType: stats?.totalDepositCharges?.change?.includes('+') ? 'increase' : 'decrease',
      description: 'Platform fees collected',
    },
    {
      title: 'Total Withdrawal Charges',
      value: formatCurrencyWithSettings(stats?.totalWithdrawalCharges?.amount || 0, systemSettings),
      icon: DollarSign,
      change: stats?.totalWithdrawalCharges?.change || '+0%',
      changeType: stats?.totalWithdrawalCharges?.change?.includes('+') ? 'increase' : 'decrease',
      description: 'Platform fees collected',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Welcome to the admin dashboard - Real-time data ({systemSettings.currencyCode})
          </p>
        </div>

        {/* Today's Stats */}
        <div className="px-2 sm:px-4 lg:px-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Today's Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {todayStats.map((stat, index) => (
              <StatCard key={index} stat={stat} isToday={true} />
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="px-2 sm:px-4 lg:px-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {financialStats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="px-2 sm:px-4 lg:px-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {overallStats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
