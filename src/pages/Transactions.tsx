
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, Wallet2, TrendingUp, Filter, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithSettings } from '../lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import AppLayout from '../components/AppLayout';

const Transactions = () => {
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) {
      console.log('No user found, cannot fetch transactions');
      setLoading(false);
      return;
    }

    console.log('Fetching transactions for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Transactions query result:', { data, error });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions: ' + error.message);
        return;
      }

      console.log('Fetched transactions:', data);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'deposit' && (transaction.type === 'deposit' || transaction.type === 'signup_bonus')) ||
      (selectedFilter === 'withdraw' && (transaction.type === 'withdrawal' || transaction.type === 'investment')) ||
      (selectedFilter === 'profit' && (transaction.type === 'profit' || transaction.type === 'daily_profit' || transaction.type === 'referral_commission' || transaction.type === 'commission' || transaction.type === 'referral_bonus' || transaction.type === 'game'));
    
    const matchesSearch = !searchTerm || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const totalBalance = user?.available_balance || 0;
  const thisMonthTransactions = transactions
    .filter(t => {
      const transactionDate = new Date(t.created_at);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
        transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => {
      if (t.type === 'deposit' || t.type === 'commission' || t.type === 'referral_bonus' || t.type === 'referral_commission' || t.type === 'daily_profit' || t.type === 'profit' || t.type === 'signup_bonus') {
        return sum + Number(t.amount);
      } else if (t.type === 'withdrawal' || t.type === 'investment') {
        return sum - Number(t.amount);
      } else if (t.type === 'game') {
        return sum + Number(t.amount); // Game amount can be positive (win) or negative (loss)
      }
      return sum;
    }, 0);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposit' },
    { id: 'withdraw', label: 'Withdraw' },
    { id: 'profit', label: 'Profit' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
    } else if (status === 'pending') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pending</span>;
    } else if (status === 'failed') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>;
    }
    return null;
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'deposit' || transaction.type === 'referral_commission' || transaction.type === 'commission' || transaction.type === 'referral_bonus' || transaction.type === 'daily_profit' || transaction.type === 'profit' || transaction.type === 'signup_bonus') {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    } else if (transaction.type === 'withdrawal' || transaction.type === 'investment') {
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    } else if (transaction.type === 'game') {
      const amount = Number(transaction.amount);
      return amount >= 0 ? 
        <ArrowDownLeft className="w-5 h-5 text-green-600" /> : 
        <ArrowUpRight className="w-5 h-5 text-red-500" />;
    }
    return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
  };

  const getTransactionTitle = (transaction: any) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'referral_commission':
        return 'Referral Commission';
      case 'commission':
        return 'Daily Profit';
      case 'daily_profit':
        return 'Daily Profit';
      case 'profit':
        return 'Investment Profit';
      case 'referral_bonus':
        return 'Referral Bonus';
      case 'signup_bonus':
        return 'Signup Bonus';
      case 'investment':
        return 'Investment';
      case 'game':
        const amount = Number(transaction.amount);
        return amount >= 0 ? 'Game Win' : 'Game Play';
      default:
        return transaction.type;
    }
  };

  const getAmountDisplay = (transaction: any) => {
    const amount = Number(transaction.amount);
    if (transaction.type === 'deposit' || transaction.type === 'referral_commission' || transaction.type === 'commission' || transaction.type === 'referral_bonus' || transaction.type === 'daily_profit' || transaction.type === 'profit' || transaction.type === 'signup_bonus') {
      return `+${formatCurrencyWithSettings(amount, systemSettings)}`;
    } else if (transaction.type === 'withdrawal' || transaction.type === 'investment') {
      return `-${formatCurrencyWithSettings(Math.abs(amount), systemSettings)}`;
    } else if (transaction.type === 'game') {
      return amount >= 0 ? 
        `+${formatCurrencyWithSettings(amount, systemSettings)}` : 
        `-${formatCurrencyWithSettings(Math.abs(amount), systemSettings)}`;
    }
    return formatCurrencyWithSettings(amount, systemSettings);
  };

  const getAmountColor = (transaction: any) => {
    if (transaction.type === 'deposit' || transaction.type === 'referral_commission' || transaction.type === 'commission' || transaction.type === 'referral_bonus' || transaction.type === 'daily_profit' || transaction.type === 'profit' || transaction.type === 'signup_bonus') {
      return 'text-green-600';
    } else if (transaction.type === 'withdrawal' || transaction.type === 'investment') {
      return 'text-red-500';
    } else if (transaction.type === 'game') {
      const amount = Number(transaction.amount);
      return amount >= 0 ? 'text-green-600' : 'text-red-500';
    }
    return 'text-green-600';
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

  if (!user) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6">
            <p className="text-gray-600 mb-4">Please log in to view transactions</p>
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/40">
        {/* Compact Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-600 p-3 pt-6 pb-4 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/15 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-10 -translate-x-10"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-white/5 to-transparent rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Link to="/" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30">
                    <Wallet2 className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white drop-shadow-sm">Transactions</h1>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-1 rounded-full backdrop-blur-sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-1 rounded-full backdrop-blur-sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Compact Balance Summary */}
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-3 border border-white/30 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-emerald-100 text-xs font-medium mb-1">Available Balance</p>
                  <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrencyWithSettings(totalBalance, systemSettings)}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-xs flex items-center justify-end font-medium mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    This Month
                  </p>
                  <p className={`text-sm font-bold drop-shadow-sm ${thisMonthTransactions >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {thisMonthTransactions >= 0 ? '+' : ''}{formatCurrencyWithSettings(Math.abs(thisMonthTransactions), systemSettings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-3 relative z-10">
          {/* Compact Filter Tabs */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-1 mb-3 shadow-lg border border-emerald-100/50">
            <div className="grid grid-cols-4 gap-0">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "ghost"}
                  className={`rounded-lg text-xs font-medium transition-all duration-200 h-8 ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md transform scale-[1.02]'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/95 backdrop-blur-sm border-emerald-200/70 focus:border-emerald-400 rounded-xl h-10 shadow-sm text-sm"
              />
            </div>
          </div>

          {/* Compact Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wallet2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-base font-medium text-gray-600 mb-1">No transactions found</p>
                {transactions.length === 0 && (
                  <p className="text-xs text-gray-500">You haven't made any transactions yet.</p>
                )}
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-emerald-100/30">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200/50">
                        {getTransactionIcon(transaction)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{getTransactionTitle(transaction)}</h3>
                          <span className={`font-bold text-sm ${getAmountColor(transaction)}`}>
                            {getAmountDisplay(transaction)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{transaction.description || `${transaction.type} transaction`}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(transaction.status)}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Compact Load More Button */}
          {filteredTransactions.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" className="bg-white/90 backdrop-blur-sm border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl px-6 text-emerald-700 font-medium shadow-sm text-sm h-8">
                Load More Transactions
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Transactions;
