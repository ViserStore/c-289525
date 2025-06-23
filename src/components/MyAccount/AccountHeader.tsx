
import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  profile_image_url?: string;
  account_status: string;
}

const AccountHeader = () => {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, phone_number, email, profile_image_url, account_status')
            .eq('email', user.email)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load user data');
          } else {
            setUserData(data);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('account-header-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userData.id}`
        },
        (payload) => {
          console.log('Account header data updated:', payload);
          if (payload.new) {
            setUserData(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 p-4 shadow-xl">
        <div className="animate-pulse">
          <div className="h-12 bg-white/20 rounded-xl mb-3"></div>
          <div className="h-16 bg-white/15 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 p-4 shadow-xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-green-400/20 to-teal-400/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      
      {/* Header content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          {/* Back button */}
          <Link to="/" className="group p-2 rounded-lg bg-white/20 backdrop-blur-lg hover:bg-white/30 transition-all duration-200 border border-white/30">
            <ArrowLeft size={18} className="text-white group-hover:text-white/90 transition-colors" />
          </Link>
          
          {/* Title */}
          <div className="text-center">
            <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-lg">
              My Account
            </h1>
          </div>
          
          {/* Sign out button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-2 py-1 h-auto text-xs rounded-lg flex items-center gap-1 shadow-lg backdrop-blur-sm transition-all duration-200"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </Button>
        </div>
        
        {/* Profile Section */}
        <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/20 shadow-lg">
          <div className="flex items-center">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-white/40 shadow-lg ring-1 ring-white/20">
                <AvatarImage src={userData?.profile_image_url} alt="Profile" />
                <AvatarFallback className="bg-white/30 text-white font-bold text-sm backdrop-blur-sm">
                  {userData?.full_name ? getInitials(userData.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate drop-shadow-sm">
                {userData?.full_name || 'Loading...'}
              </h2>
              <p className="text-white/90 text-xs drop-shadow-sm flex items-center">
                <span className="w-1 h-1 bg-green-400 rounded-full mr-1"></span>
                {userData?.phone_number || 'N/A'}
              </p>
              <p className="text-white/80 text-xs truncate drop-shadow-sm">
                {userData?.email || user?.email || 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  userData?.account_status === 'active' 
                    ? 'bg-green-500/30 text-green-100' 
                    : 'bg-yellow-500/30 text-yellow-100'
                }`}>
                  {userData?.account_status || 'Unknown'}
                </span>
              </div>
              <Link to="/profile-edit">
                <Button variant="outline" size="sm" className="bg-white/95 hover:bg-white text-emerald-700 border-none px-2 py-1 h-auto text-xs rounded-lg flex items-center gap-1 shadow-lg backdrop-blur-sm transition-all duration-200 font-semibold">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4V20H20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5L21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Edit</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHeader;
