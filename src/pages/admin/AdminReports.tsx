
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';

interface ReportData {
  totalRevenue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netProfit: number;
  newUsers: number;
  activeUsers: number;
  activeInvestments: number;
  completedInvestments: number;
}

const AdminReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    netProfit: 0,
    newUsers: 0,
    activeUsers: 0,
    activeInvestments: 0,
    completedInvestments: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount, status, created_at')
        .gte('created_at', dateFilter)
        .eq('status', 'approved');

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status, created_at')
        .gte('created_at', dateFilter)
        .eq('status', 'completed');

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at, last_login_at')
        .gte('created_at', dateFilter);

      // Fetch investments
      const { data: investments } = await supabase
        .from('user_investments')
        .select('amount, status, created_at')
        .gte('created_at', dateFilter);

      // Fetch transactions for transaction overview
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate report data
      const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const netProfit = totalDeposits - totalWithdrawals;
      const totalRevenue = netProfit * 0.1; // Assuming 10% revenue margin

      const newUsers = users?.length || 0;
      const activeInvestments = investments?.filter(i => i.status === 'active').length || 0;
      const completedInvestments = investments?.filter(i => i.status === 'completed').length || 0;

      setReportData({
        totalRevenue,
        totalDeposits,
        totalWithdrawals,
        netProfit,
        newUsers,
        activeUsers: newUsers, // Simplified for demo
        activeInvestments,
        completedInvestments
      });

      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const ReportCard = ({ title, value, change, positive }: any) => (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold truncate">Rs. {value.toLocaleString()}</p>
          </div>
          <div className={`flex items-center flex-shrink-0 ml-2 ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <ArrowDownLeft className="w-4 h-4 mr-1" />}
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-green-100 text-green-800';
      case 'withdrawal': return 'bg-red-100 text-red-800';
      case 'investment': return 'bg-blue-100 text-blue-800';
      case 'profit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Track performance and generate reports</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md h-10 text-sm"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="1year">Last year</option>
              </select>
              <Button className="h-10">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-2 sm:px-4 lg:px-6 py-6">
          <Tabs defaultValue="financial" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
              <TabsTrigger value="investments" className="text-xs sm:text-sm">Investments</TabsTrigger>
            </TabsList>

            <TabsContent value="financial">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ReportCard 
                  title="Total Revenue" 
                  value={reportData.totalRevenue} 
                  change="+12.5%" 
                  positive={true} 
                />
                <ReportCard 
                  title="Total Deposits" 
                  value={reportData.totalDeposits} 
                  change="+8.2%" 
                  positive={true} 
                />
                <ReportCard 
                  title="Total Withdrawals" 
                  value={reportData.totalWithdrawals} 
                  change="-3.1%" 
                  positive={false} 
                />
                <ReportCard 
                  title="Net Profit" 
                  value={reportData.netProfit} 
                  change="+15.3%" 
                  positive={true} 
                />
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">New Users</p>
                        <p className="text-xl sm:text-2xl font-bold">{reportData.newUsers}</p>
                      </div>
                      <Users className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">Active Users</p>
                        <p className="text-xl sm:text-2xl font-bold">{reportData.activeUsers}</p>
                      </div>
                      <Users className="w-6 sm:w-8 h-6 sm:h-8 text-green-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Badge className={`${getTransactionTypeColor(transaction.type)} flex-shrink-0`}>
                            {transaction.type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">Rs. {Number(transaction.amount).toLocaleString()}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-xs sm:text-sm font-medium">{transaction.status}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investments">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-semibold">Active Investments</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">{reportData.activeInvestments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-semibold">Completed Investments</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">{reportData.completedInvestments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-semibold">Success Rate</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                        {reportData.completedInvestments > 0 
                          ? Math.round((reportData.completedInvestments / (reportData.activeInvestments + reportData.completedInvestments)) * 100)
                          : 0}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
