
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, TrendingUp, Clock, Percent, Gift, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '../components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatAmount } from '../lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface CommissionData {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  level: number;
  commission_amount: number;
  commission_percentage: number;
  trigger_type: string;
  trigger_amount: number;
  status: string;
  created_at: string;
  referred_user?: {
    full_name: string;
  };
}

const Commission = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();

  useEffect(() => {
    if (user?.id) {
      fetchCommissions();
    }
  }, [user?.id]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      const { data: commissionData, error } = await supabase
        .from('referral_commissions')
        .select(`
          *,
          referred_user:users!referral_commissions_referred_user_id_fkey(full_name)
        `)
        .eq('referrer_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions:', error);
        return;
      }

      setCommissions(commissionData || []);
      
      // Calculate total earnings
      const total = (commissionData || []).reduce((sum, commission) => {
        return sum + (commission.commission_amount || 0);
      }, 0);
      
      setTotalEarnings(total);

      // Calculate monthly earnings
      const monthly = (commissionData || [])
        .filter(c => {
          const commissionDate = new Date(c.created_at);
          const now = new Date();
          return commissionDate.getMonth() === now.getMonth() && 
            commissionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);
      
      setMonthlyEarnings(monthly);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyAmount = (amount: number) => {
    return `${systemSettings.currencySymbol} ${formatAmount(amount)}`;
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposit' },
  ];

  const filteredCommissions = commissions.filter(commission => {
    const matchesFilter = selectedFilter === 'all' || commission.trigger_type === selectedFilter;
    const matchesSearch = !searchTerm || 
      commission.referred_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.trigger_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Completed</span>;
    } else if (status === 'pending') {
      return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pending</span>;
    }
    return null;
  };

  const getCommissionIcon = (triggerType: string) => {
    if (triggerType === 'deposit') {
      return <Gift className="w-4 h-4 text-emerald-600" />;
    }
    return <Gift className="w-4 h-4 text-emerald-600" />;
  };

  const formatCommissionTitle = (commission: CommissionData) => {
    const type = commission.trigger_type === 'deposit' ? 'Deposit' : 'Commission';
    return `Level ${commission.level} ${type} Commission`;
  };

  const formatCommissionSubtitle = (commission: CommissionData) => {
    const userName = commission.referred_user?.full_name || 'Unknown User';
    const type = commission.trigger_type === 'deposit' ? 'deposit' : 'transaction';
    return `From ${userName}'s ${type} of ${formatCurrencyAmount(commission.trigger_amount)}`;
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

  if (loading) {
    return (
      <AppLayout showHeader={false} showBottomNav={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
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
                  <Percent className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Commission History</h1>
              </div>
            </div>
          </div>
          
          {/* Compact Commission Summary */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-xs">Total Commission</p>
                <p className="text-white text-lg font-bold">{formatCurrencyAmount(totalEarnings)}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  This Month
                </p>
                <p className="text-green-200 text-sm font-semibold">+{formatCurrencyAmount(monthlyEarnings)}</p>
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
              placeholder="Search commissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 backdrop-blur-sm border-emerald-200 focus:border-emerald-400 rounded-xl h-10"
            />
          </div>

          {/* Compact Commission List */}
          <div className="space-y-2">
            {filteredCommissions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No commission records found</p>
              </div>
            ) : (
              filteredCommissions.map((commission) => (
                <Card key={commission.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all hover:scale-[1.01]">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        {getCommissionIcon(commission.trigger_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {formatCommissionTitle(commission)}
                          </h3>
                          <span className="font-bold text-sm text-emerald-600">
                            +{formatCurrencyAmount(commission.commission_amount)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {formatCommissionSubtitle(commission)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            {getStatusBadge(commission.status)}
                            <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              Level {commission.level}
                            </span>
                            <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                              {formatAmount(commission.commission_percentage)}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(commission.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More Button */}
          {filteredCommissions.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 rounded-xl px-6 text-emerald-700 font-medium text-sm h-9">
                Load More Commissions
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Commission;
