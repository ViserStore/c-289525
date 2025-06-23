import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toastService from '@/services/toastService';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  priority: string;
  created_at: string;
  metadata: any;
  source: 'admin';
  user_has_read?: boolean;
}

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  metadata: any;
  source: 'user';
}

type Notification = AdminNotification | UserNotification;

const UserNotifications = () => {
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Fetching all notifications for user:', user.id);
      
      // Get admin notifications (broadcast)
      const { data: adminNotifications, error: adminError } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_broadcast', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (adminError) {
        console.error('Error fetching admin notifications:', adminError);
      }

      // Get user notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notifications_user')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (userError) {
        console.error('Error fetching user notifications:', userError);
      }

      console.log('Admin notifications found:', adminNotifications?.length || 0);
      console.log('User notifications found:', userNotifications?.length || 0);

      // Check which admin notifications the user has read
      const adminIds = (adminNotifications || []).map(n => n.id);
      let readBroadcasts: string[] = [];
      
      if (adminIds.length > 0) {
        const { data: readData, error: readError } = await supabase
          .from('user_notification_reads')
          .select('notification_id')
          .eq('user_id', user.id)
          .in('notification_id', adminIds);

        if (!readError && readData) {
          readBroadcasts = readData.map(r => r.notification_id);
        }
      }

      // Format and combine notifications
      const formattedAdminNotifications: AdminNotification[] = (adminNotifications || []).map(n => ({
        ...n,
        source: 'admin' as const,
        user_has_read: readBroadcasts.includes(n.id)
      }));

      const formattedUserNotifications: UserNotification[] = (userNotifications || []).map(n => ({
        ...n,
        source: 'user' as const
      }));

      const allNotifications = [
        ...formattedAdminNotifications,
        ...formattedUserNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Total notifications combined:', allNotifications.length);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (notification: Notification) => {
    try {
      if (notification.source === 'admin') {
        const { error } = await supabase.rpc('mark_notification_read', {
          p_notification_id: notification.id
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('mark_user_notification_read', {
          p_notification_id: notification.id
        });
        if (error) throw error;
      }

      setNotifications(notifications.map(n => 
        n.id === notification.id 
          ? notification.source === 'admin' 
            ? { ...n, user_has_read: true }
            : { ...n, is_read: true }
          : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toastService.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all admin notifications as read
      const unreadAdminNotifications = notifications.filter(n => 
        n.source === 'admin' && !n.user_has_read
      );
      
      for (const notification of unreadAdminNotifications) {
        await supabase.rpc('mark_notification_read', {
          p_notification_id: notification.id
        });
      }

      // Mark all user notifications as read
      const unreadUserNotifications = notifications.filter(n => 
        n.source === 'user' && !n.is_read
      );
      
      for (const notification of unreadUserNotifications) {
        await supabase.rpc('mark_user_notification_read', {
          p_notification_id: notification.id
        });
      }

      setNotifications(notifications.map(n => 
        n.source === 'admin' 
          ? { ...n, user_has_read: true }
          : { ...n, is_read: true }
      ));
      
      toastService.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toastService.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notification: Notification) => {
    try {
      if (notification.source === 'admin') {
        // For admin notifications, just mark as read
        await markAsRead(notification);
      } else {
        const { error } = await supabase.rpc('clear_user_notification', {
          p_notification_id: notification.id
        });
        if (error) throw error;
      }

      setNotifications(notifications.filter(n => n.id !== notification.id));
      toastService.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toastService.error('Failed to remove notification');
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-50 border-l-green-400 hover:bg-green-100';
      case 'withdrawal':
        return 'bg-blue-50 border-l-blue-400 hover:bg-blue-100';
      case 'investment':
        return 'bg-purple-50 border-l-purple-400 hover:bg-purple-100';
      case 'security':
        return 'bg-orange-50 border-l-orange-400 hover:bg-orange-100';
      case 'admin':
      case 'system':
        return 'bg-red-50 border-l-red-400 hover:bg-red-100';
      default:
        return 'bg-gray-50 border-l-gray-400 hover:bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isNotificationUnread = (notification: Notification) => {
    return notification.source === 'admin' 
      ? !notification.user_has_read 
      : !notification.is_read;
  };

  const formatNotificationMessage = (message: string) => {
    // Replace hardcoded currency symbols with system currency symbol
    return message.replace(/Rs\.\s?/g, `${systemSettings.currencySymbol} `);
  };

  const unreadCount = notifications.filter(isNotificationUnread).length;

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg p-4 h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
              {unreadCount} new
            </Badge>
          )}
        </h3>
        
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 transition-all duration-200 cursor-pointer group ${
                getTypeStyles(notification.type)
              } ${isNotificationUnread(notification) ? 'shadow-sm' : ''}`}
              onClick={() => markAsRead(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 text-lg">
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium text-gray-900 text-sm ${
                          isNotificationUnread(notification) ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {notification.source === 'admin' && (
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-red-50 text-red-600 border-red-200">
                              Admin
                            </Badge>
                          )}
                          {isNotificationUnread(notification) && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {formatNotificationMessage(notification.message)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all duration-200"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
