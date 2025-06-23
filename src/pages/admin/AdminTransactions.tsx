
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const AdminTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { settings } = useSystemSettings();
  const transactionsPerPage = 10;

  // Handle window resize to force re-render on screen size changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users!transactions_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'bg-green-100 text-green-800 border border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'failed': 'bg-red-100 text-red-800 border border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.pending} text-xs px-2 py-0.5`}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      'deposit': 'bg-blue-100 text-blue-800 border border-blue-200',
      'withdrawal': 'bg-purple-100 text-purple-800 border border-purple-200',
      'investment': 'bg-green-100 text-green-800 border border-green-200',
      'profit': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'referral': 'bg-orange-100 text-orange-800 border border-orange-200'
    };
    
    return (
      <Badge className={`${typeColors[type as keyof typeof typeColors] || typeColors.deposit} text-xs px-2 py-0.5`}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 space-y-4">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64 h-9 text-sm"
            />
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-blue-100 text-xs">Total Transactions</p>
                <p className="text-lg font-bold">{filteredTransactions.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-green-100 text-xs">Completed</p>
                <p className="text-lg font-bold">
                  {filteredTransactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-yellow-100 text-xs">Pending</p>
                <p className="text-lg font-bold">
                  {filteredTransactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Transactions Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-full">
                {/* Compact Table Header */}
                <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 text-xs font-medium text-gray-700 border-b">
                  <div>User</div>
                  <div>Type</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div className="text-center">Actions</div>
                </div>
                
                {/* Compact Table Body */}
                <div className="divide-y divide-gray-100">
                  {currentTransactions.map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-6 gap-2 p-3 hover:bg-gray-50 transition-colors items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.users?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {transaction.users?.email}
                        </p>
                      </div>
                      
                      <div>
                        {getTypeBadge(transaction.type)}
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrencyWithSettings(Number(transaction.amount), settings)}
                        </p>
                      </div>
                      
                      <div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            // View transaction details
                            console.log('View transaction:', transaction);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Compact Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs px-2">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No transactions found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTransactions;
