
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ArrowDownLeft, Clock, Wallet2, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithSettings } from '../lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import AppLayout from '../components/AppLayout';

const DepositHistory = () => {
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchDeposits();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) {
      toast.error('Please log in to view deposit history');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposits:', error);
        toast.error('Failed to load deposit history');
        return;
      }

      setDeposits(data || []);
    } catch (error) {
      console.error('Error in fetchDeposits:', error);
      toast.error('Failed to load deposit history');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesFilter = selectedFilter === 'all' || deposit.status === selectedFilter;
    const matchesSearch = !searchTerm || 
      deposit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const totalDeposited = deposits
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const thisMonthDeposited = deposits
    .filter(d => {
      const depositDate = new Date(d.created_at);
      const now = new Date();
      return d.status === 'approved' && 
        depositDate.getMonth() === now.getMonth() && 
        depositDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'approved', label: 'Completed' },
    { id: 'pending', label: 'Pending' },
    { id: 'rejected', label: 'Failed' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Completed</span>;
    } else if (status === 'pending') {
      return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pending</span>;
    } else if (status === 'rejected') {
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getBankDetails = (deposit: any) => {
    if (deposit.bank_details) {
      try {
        const bankDetails = JSON.parse(deposit.bank_details);
        return `From ${bankDetails.bank_name || 'Bank'} ****${bankDetails.account_number?.slice(-4) || '****'}`;
      } catch {
        return `From ${deposit.payment_method}`;
      }
    }
    return `From ${deposit.payment_method}`;
  };

  if (!user) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6">
            <p className="text-gray-600 mb-4">Please log in to view deposit history</p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-3 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Link to="/" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Wallet2 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Deposit History</h1>
              </div>
            </div>
          </div>
          
          {/* Compact Balance Summary */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-xs">Total Deposited</p>
                <p className="text-white text-lg font-bold">{formatCurrencyWithSettings(totalDeposited, systemSettings)}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  This Month
                </p>
                <p className="text-green-200 text-sm font-semibold">{formatCurrencyWithSettings(thisMonthDeposited, systemSettings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-3 space-y-3">
          {/* Compact Filter Tabs */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-emerald-100">
            <div className="flex space-x-1">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "ghost"}
                  className={`flex-1 rounded-lg text-xs font-medium transition-all h-8 ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-emerald-50'
                  }`}
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search deposits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 backdrop-blur-sm border-emerald-200 focus:border-emerald-400 rounded-xl h-10"
            />
          </div>

          {/* Compact Deposits List */}
          <div className="space-y-2">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No deposits found</p>
              </div>
            ) : (
              filteredDeposits.map((deposit) => (
                <Card key={deposit.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all hover:scale-[1.01]">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{deposit.payment_method}</h3>
                          <span className="font-bold text-sm text-emerald-600">
                            +{formatCurrencyWithSettings(Number(deposit.amount), systemSettings)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{getBankDetails(deposit)}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(deposit.status)}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(deposit.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DepositHistory;
