import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toastService from '@/services/toastService';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  priority: string;
  created_at: string;
  metadata: any;
  is_broadcast: boolean;
}

const AdminNotifications = () => {
  const { settings: systemSettings } = useSystemSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    priority: 'normal',
    icon: '📢'
  });

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      const adminData = JSON.parse(storedAdmin);
      setAdminUser(adminData);
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Get only admin notifications from the notifications table
      const { data: adminNotifications, error: adminError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('Error fetching admin notifications:', adminError);
        toastService.error("Failed to fetch notifications");
        return;
      }

      console.log('Fetched notifications:', adminNotifications);
      setNotifications(adminNotifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toastService.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toastService.error("Please fill in all required fields");
      return;
    }

    if (!adminUser) {
      toastService.error("Admin user not found. Please log in again.");
      return;
    }

    setSending(true);
    try {
      const { data: dbAdmin, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', adminUser.username)
        .single();

      if (adminError || !dbAdmin) {
        console.error('Error finding admin user:', adminError);
        throw new Error('Admin user not found in database');
      }

      const { data, error } = await supabase.rpc('create_broadcast_notification', {
        p_admin_id: dbAdmin.id,
        p_type: formData.type,
        p_title: formData.title,
        p_message: formData.message,
        p_icon: formData.icon,
        p_priority: formData.priority,
        p_metadata: {}
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      toastService.success("Broadcast notification sent successfully!");

      setFormData({
        title: '',
        message: '',
        type: 'system',
        priority: 'normal',
        icon: '📢'
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toastService.error(error instanceof Error ? error.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNotificationMessage = (message: string) => {
    // Replace hardcoded currency symbols with system currency symbol
    return message.replace(/Rs\.\s?/g, `${systemSettings.currencySymbol} `);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Notifications Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Send broadcasts and manage notifications</p>
            </div>
            {adminUser && (
              <p className="text-sm text-gray-600">Logged in as: {adminUser.username}</p>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-2 sm:px-4 lg:px-6 py-6 space-y-6">
          {/* Send Broadcast Notification */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Bell className="w-5 h-5" />
                <span>Send Broadcast Notification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Notification title"
                      className="h-10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-10 text-sm"
                    >
                      <option value="system">System</option>
                      <option value="security">Security</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="promotion">Promotion</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-10 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Notification message"
                    rows={3}
                    className="text-sm"
                    required
                  />
                </div>

                <Button type="submit" disabled={sending || !adminUser} className="w-full h-10">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Broadcast Notification'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* All Notifications */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">All Notifications ({notifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 20).map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="text-lg flex-shrink-0">{notification.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">{notification.title}</h4>
                              <Badge className="bg-red-100 text-red-800 text-xs flex-shrink-0">
                                <Users className="w-3 h-3 mr-1" />
                                {notification.is_broadcast ? 'Broadcast' : 'Direct'}
                              </Badge>
                              <Badge className={`${getPriorityColor(notification.priority)} text-xs flex-shrink-0`}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {formatNotificationMessage(notification.message)}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
                              <span className="truncate">{formatDate(notification.created_at)}</span>
                              <span className="truncate">Type: {notification.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length > 20 && (
                    <div className="text-center text-gray-500 text-sm">
                      Showing 20 of {notifications.length} notifications
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">No notifications have been sent yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
