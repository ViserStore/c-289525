import React, { useState, useEffect } from 'react';
import { Bell, Search, CheckCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toastService from '@/services/toastService';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface HeaderProps {
  pageTitle?: string;
}

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

interface UserData {
  id: string;
  full_name: string;
  profile_image_url?: string;
}

const Header = ({ pageTitle }: HeaderProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const unreadCount = notifications.filter(n => 
    n.source === 'admin' ? !n.user_has_read : !n.is_read
  ).length;

  // Fetch user data including profile image
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, profile_image_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('header-user-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('User data updated in header:', payload);
          if (payload.new) {
            setUserData(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Fetch both admin and user notifications
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
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8); // Show max 8 notifications in header

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

  // Set up real-time subscriptions for both notification tables
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'is_broadcast=eq.true'
        },
        (payload) => {
          console.log('Admin notification change detected:', payload);
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications_user',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User notification change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      toastService.error('Failed to mark notification as read');
    }
  };
  
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Mark all admin notifications as read
      const unreadAdminNotifications = notifications.filter(n => 
        n.source === 'admin' && !n.user_has_read
      );
      
      for (const notification of unreadAdminNotifications) {
        await supabase.rpc('mark_notification_read_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
        });
      }

      // Mark all user notifications as read
      const unreadUserNotifications = notifications.filter(n => 
        n.source === 'user' && !n.is_read
      );
      
      for (const notification of unreadUserNotifications) {
        await supabase.rpc('mark_user_notification_read_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
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
    if (!user) return;
    
    try {
      if (notification.source === 'admin') {
        // For admin notifications, just mark as read
        await markAsRead(notification);
      } else {
        const { error } = await supabase.rpc('clear_user_notification_with_user', {
          p_notification_id: notification.id,
          p_user_id: user.id
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Use user's profile image from database or fallback
  const profileImageUrl = userData?.profile_image_url || "/lovable-uploads/ecb13db3-ef6b-460e-bcad-5ce0e5bd11dd.png";
  
  return (
    <div className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 p-3 pt-safe sticky top-0 z-20 shadow-lg backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10"></div>
      
      <div className="relative z-10 flex items-center justify-between max-w-screen-lg mx-auto">
        <div className="flex items-center">
          <Link to="/my-account" className="group">
            <div className="relative">
              <Avatar className="h-9 w-9 border-2 border-white/30 shadow-lg ring-1 ring-white/20 transition-all duration-200 group-hover:scale-105">
                <AvatarImage 
                  src={profileImageUrl}
                  alt="Profile"
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/20 text-white font-bold text-sm backdrop-blur-sm">
                  {userData?.full_name ? getInitials(userData.full_name) : user?.full_name ? getInitials(user.full_name) : 'DP'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
            </div>
          </Link>
        </div>
        
        <div className="text-center flex-1 mx-3">
          <h1 className="text-white text-lg font-bold tracking-wide drop-shadow-sm">
            {pageTitle || "easypaisa"}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="relative focus:outline-none group p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95" aria-label="Search">
            <Search size={isMobile ? 18 : 20} className="text-white drop-shadow-sm group-hover:text-white/90 transition-colors" />
          </button>
          
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <button className="relative focus:outline-none group p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95" aria-label="Notifications">
                <Bell size={isMobile ? 18 : 20} className="text-white drop-shadow-sm group-hover:text-white/90 transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center animate-pulse">
                    <span className="text-[10px] text-white font-bold px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 mr-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm" align="end">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                      {unreadCount > 0 && (
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                            {unreadCount} new
                          </Badge>
                        </div>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="flex items-center space-x-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <CheckCheck size={14} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                      <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`relative px-6 py-4 border-l-4 transition-all duration-200 cursor-pointer group ${
                            getTypeStyles(notification.type)
                          } ${isNotificationUnread(notification) ? 'shadow-sm' : ''}`}
                          onClick={() => markAsRead(notification)}
                        >
                          {isNotificationUnread(notification) && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all duration-200"
                          >
                            <X size={12} className="text-gray-400 hover:text-gray-600" />
                          </button>
                          
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-lg border border-gray-100">
                              {notification.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className={`font-semibold text-gray-900 text-sm leading-tight ${
                                  isNotificationUnread(notification) ? 'font-bold' : ''
                                }`}>
                                  {notification.title}
                                </h4>
                              </div>
                              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                {formatNotificationMessage(notification.message)}
                              </p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-gray-400 font-medium">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                                <div className="flex items-center space-x-1 ml-2">
                                  {notification.source === 'admin' && (
                                    <Badge variant="outline" className="text-xs px-2 py-0 bg-red-50 text-red-600 border-red-200">
                                      Admin
                                    </Badge>
                                  )}
                                  {notification.source === 'user' && (
                                    <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-600 border-blue-200">
                                      Activity
                                    </Badge>
                                  )}
                                  {isNotificationUnread(notification) && (
                                    <Badge variant="outline" className="text-xs px-2 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                      New
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">No notifications yet</h3>
                      <p className="text-gray-500 text-sm">We'll notify you when something important happens</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <Link 
                      to="/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-sm text-emerald-600 hover:text-emerald-800 font-medium w-full text-center py-1 hover:bg-emerald-50 rounded transition-colors block"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Header;
