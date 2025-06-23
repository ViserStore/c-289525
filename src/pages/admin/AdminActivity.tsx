import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, Search, Filter, Eye, User, Shield } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

const AdminActivity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const activityLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      user: 'john.doe@example.com',
      action: 'Login',
      type: 'auth',
      ip: '192.168.1.100',
      device: 'Chrome on Windows',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:10',
      user: 'jane.smith@example.com',
      action: 'Deposit Request',
      type: 'transaction',
      ip: '192.168.1.101',
      device: 'Safari on iPhone',
      status: 'pending',
      details: '$500 via PayPal'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:45',
      user: 'admin@example.com',
      action: 'User Verification',
      type: 'admin',
      ip: '192.168.1.1',
      device: 'Chrome on Mac',
      status: 'success',
      details: 'Approved KYC for user ID: 1234'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:30',
      user: 'bob.wilson@example.com',
      action: 'Failed Login Attempt',
      type: 'security',
      ip: '203.0.113.45',
      device: 'Firefox on Linux',
      status: 'failed',
      details: 'Invalid password - 3rd attempt'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:15',
      user: 'alice.brown@example.com',
      action: 'Withdrawal Request',
      type: 'transaction',
      ip: '192.168.1.102',
      device: 'Chrome on Android',
      status: 'success',
      details: '$250 to Bank Account'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auth': return <User className="w-4 h-4" />;
      case 'transaction': return <Activity className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'auth': return 'bg-blue-100 text-blue-800';
      case 'transaction': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="px-2 sm:px-4 lg:px-6 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Activity & Logs</h1>
          <p className="text-gray-600 text-sm sm:text-base">Monitor user activities and system events</p>
        </div>

        {/* Stats Cards */}
        <div className="px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold">12,456</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <User className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed Logins</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                  <Shield className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold">892</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="px-2 sm:px-4 lg:px-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by user or action..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="auth">Authentication</option>
                    <option value="transaction">Transactions</option>
                    <option value="admin">Admin Actions</option>
                    <option value="security">Security</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs Table */}
        <div className="px-2 sm:px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTypeIcon(log.type)}
                          <span className="ml-2">{log.action}</span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(log.type)}>
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.device}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminActivity;
