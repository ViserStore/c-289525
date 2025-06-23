import React, { useState, useEffect } from 'react';
import { Bell, X, ArrowLeft, BellRing, Sparkles, Crown, Star, CheckCircle2, AlertCircle, Info, Gift, Settings } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

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

const Notifications = () => {
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
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('Error fetching admin notifications:', adminError);
      }

      // Get user notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notifications_user')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching user notifications:', userError);
      }

      console.log('Admin notifications:', adminNotifications);
      console.log('User notifications:', userNotifications);

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

      console.log('Combined notifications:', allNotifications);
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
    if (!user) return;
    
    try {
      if (notification.source === 'admin') {
        const { error } = await supabase.rpc('mark_notification_read_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('mark_user_notification_read_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
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
    }
  };

  const clearNotification = async (notification: Notification) => {
    if (!user) return;
    
    try {
      if (notification.source === 'admin') {
        await markAsRead(notification);
      } else {
        const { error } = await supabase.rpc('clear_user_notification_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
        });
        if (error) throw error;
      }

      setNotifications(notifications.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Gift className="w-4 h-4" />;
      case 'withdrawal':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'investment':
        return <Star className="w-4 h-4" />;
      case 'security':
        return <AlertCircle className="w-4 h-4" />;
      case 'admin':
      case 'system':
        return <Crown className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'deposit':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-l-green-500',
          icon: 'text-green-600 bg-green-100',
          glow: 'shadow-green-100'
        };
      case 'withdrawal':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-teal-50',
          border: 'border-l-teal-500',
          icon: 'text-teal-600 bg-teal-100',
          glow: 'shadow-teal-100'
        };
      case 'investment':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
          border: 'border-l-emerald-500',
          icon: 'text-emerald-600 bg-emerald-100',
          glow: 'shadow-emerald-100'
        };
      case 'security':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
          border: 'border-l-amber-500',
          icon: 'text-amber-600 bg-amber-100',
          glow: 'shadow-amber-100'
        };
      case 'admin':
      case 'system':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-lime-50',
          border: 'border-l-green-600',
          icon: 'text-green-700 bg-green-200',
          glow: 'shadow-green-100'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-l-green-400',
          icon: 'text-green-600 bg-green-100',
          glow: 'shadow-green-100'
        };
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
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
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

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen max-w-sm mx-auto shadow-lg relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-200/20 to-emerald-300/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-teal-200/20 to-green-300/20 rounded-full blur-2xl"></div>
      </div>

      {/* Ultra Compact Header */}
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white sticky top-0 z-10 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
        
        <div className="relative p-2 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Link to="/" className="p-1 hover:bg-white/20 rounded-lg transition-all duration-200">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-sm font-bold flex items-center">
                  Notifications
                  <Sparkles className="w-3 h-3 ml-1 text-yellow-300" />
                </h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-green-100 font-medium flex items-center">
                    <BellRing className="w-2 h-2 mr-1" />
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30">
                <Bell className="w-4 h-4" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
          </div>
          
          {/* Ultra Compact Stats */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
            <div className="text-center">
              <div className="text-sm font-bold">{notifications.length}</div>
              <div className="text-xs text-green-100">Total</div>
            </div>
            <div className="w-px h-4 bg-white/30"></div>
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-300">{unreadCount}</div>
              <div className="text-xs text-green-100">Unread</div>
            </div>
            <div className="w-px h-4 bg-white/30"></div>
            <div className="text-center">
              <div className="text-sm font-bold">{notifications.filter(n => n.source === 'admin').length}</div>
              <div className="text-xs text-green-100">Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Compact Content */}
      <div className="relative p-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-md animate-pulse overflow-hidden bg-white/80">
                <div className="h-1 bg-gradient-to-r from-green-200 via-emerald-300 to-green-200"></div>
                <CardContent className="p-2">
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-green-200 rounded-lg"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-green-200 rounded w-3/4"></div>
                      <div className="h-2 bg-green-100 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/50">
              <div className="bg-gradient-to-br from-green-100 to-emerald-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">All caught up! 🎉</h3>
              <p className="text-gray-500 mb-3 text-xs">You have no new notifications</p>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-1 rounded-lg shadow-md text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification, index) => {
              const typeStyles = getTypeStyles(notification.type);
              const isUnread = isNotificationUnread(notification);
              
              return (
                <Card
                  key={notification.id}
                  className={`border-l-4 cursor-pointer transition-all duration-300 hover:shadow-lg group border-0 shadow-md overflow-hidden bg-white/90 backdrop-blur-sm transform hover:scale-[1.01] ${
                    typeStyles.border
                  } ${isUnread ? `shadow-lg ${typeStyles.glow}` : 'opacity-95'}`}
                  onClick={() => markAsRead(notification)}
                >
                  <div className={`h-1 ${isUnread ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'}`}></div>
                  <CardContent className={`p-2 ${typeStyles.bg} relative`}>
                    <div className="flex items-start space-x-2 relative z-10">
                      <div className="flex-shrink-0 relative">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${typeStyles.icon}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        {isUnread && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-semibold text-xs leading-tight ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1 ml-1">
                            {notification.source === 'admin' && (
                              <Badge className="text-xs px-1 py-0 bg-green-100 text-green-700 border-green-200 rounded-full">
                                <Crown className="w-2 h-2 mr-0.5" />
                                Admin
                              </Badge>
                            )}
                            {isUnread && (
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-xs leading-relaxed mb-2">
                          {formatNotificationMessage(notification.message)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/80 rounded-full transition-all duration-200"
                          >
                            <X className="w-2 h-2 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
