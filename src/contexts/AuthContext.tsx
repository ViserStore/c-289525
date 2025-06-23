import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  profile_image_url?: string;
  available_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  current_plan_id: string | null;
  account_status: string;
  created_at: string;
  updated_at: string;
  referral_code?: string;
  totalReferrals?: number;
  user_level?: number;
  levelInfo?: {
    name: string;
    description: string;
    color: string;
    benefits: string[];
    bonus_amount: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: any) => Promise<{ success: boolean, user?: User, error?: string }>;
  signIn: (data: any) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

const clearAllStoredData = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminUser');
    // Clear any other user-related data
    console.log('All user data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent concurrent refreshes
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }

    const sessionUser = getStoredUser();
    if (!sessionUser?.id) {
      setUser(null);
      return;
    }

    setIsRefreshing(true);

    try {
      console.log('Refreshing user data for:', sessionUser.id);
      
      // Fetch fresh user data from database to get updated balance
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (userData && !error) {
        // Check account status - if not active, sign out user
        if (userData.account_status !== 'active') {
          console.log('User account is not active, signing out:', userData.account_status);
          clearAllStoredData();
          setUser(null);
          return;
        }

        // Get referral count
        const { count: referralCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('referred_by_user_id', sessionUser.id);

        // Calculate user level based on referrals
        const calculateUserLevel = (referrals: number): number => {
          if (referrals >= 100) return 10;
          if (referrals >= 75) return 9;
          if (referrals >= 50) return 8;
          if (referrals >= 40) return 7;
          if (referrals >= 30) return 6;
          if (referrals >= 25) return 5;
          if (referrals >= 20) return 4;
          if (referrals >= 10) return 3;
          if (referrals >= 3) return 2;
          return 1;
        };

        const updatedUser: User = {
          id: userData.id,
          email: userData.email || '',
          full_name: userData.full_name || '',
          username: userData.username || '',
          phone_number: userData.phone_number || '',
          profile_image_url: userData.profile_image_url || '',
          available_balance: userData.available_balance || 0,
          total_deposits: userData.total_deposits || 0,
          total_withdrawals: userData.total_withdrawals || 0,
          current_plan_id: userData.current_plan_id,
          account_status: userData.account_status || 'active',
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          referral_code: userData.referral_code,
          totalReferrals: referralCount || 0,
          user_level: calculateUserLevel(referralCount || 0),
          levelInfo: {
            name: 'Level 1',
            description: 'Basic user level',
            color: 'blue',
            benefits: ['Basic access', 'No referral bonus'],
            bonus_amount: 0
          }
        };
        
        console.log('User data refreshed successfully:', {
          id: updatedUser.id,
          available_balance: updatedUser.available_balance,
          current_plan_id: updatedUser.current_plan_id,
          referral_code: updatedUser.referral_code,
          totalReferrals: updatedUser.totalReferrals,
          user_level: updatedUser.user_level,
          account_status: updatedUser.account_status
        });
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Also update currentUser for backward compatibility
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } else {
        console.error('Error refreshing user data:', error);
        // If user not found, clear everything
        clearAllStoredData();
        setUser(null);
      }
    } catch (error) {
      console.error('Error in refreshUser:', error);
      // On error, clear potentially stale data
      clearAllStoredData();
      setUser(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = getStoredUser();

      if (sessionUser?.id) {
        await refreshUser();
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const signUp = async (data: any) => {
    setLoading(true);
    try {
      // Check for existing phone number
      const { data: existingPhoneUser, error: phoneCheckError } = await supabase
        .from('users')
        .select('id, phone_number')
        .eq('phone_number', data.phoneNumber)
        .single();

      if (existingPhoneUser && !phoneCheckError) {
        throw new Error('This phone number is already registered. Please use a different phone number.');
      }

      // Check for existing username
      const { data: existingUsernameUser, error: usernameCheckError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', data.username)
        .single();

      if (existingUsernameUser && !usernameCheckError) {
        throw new Error('This username is already taken. Please choose another username.');
      }

      // Check for existing email if provided
      if (data.email && data.email.trim() !== '') {
        const { data: existingEmailUser, error: emailCheckError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', data.email)
          .single();

        if (existingEmailUser && !emailCheckError) {
          throw new Error('This email is already registered. Please use a different email.');
        }
      }

      // Create user directly in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            email: data.email,
            full_name: data.fullName,
            username: data.username,
            phone_number: data.phoneNumber || '',
            password: data.password,
            withdraw_pin: data.withdrawPin || '1234',
            available_balance: 0,
            total_deposits: 0,
            total_withdrawals: 0,
            referred_by_code: data.referralCode || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        
        // Handle specific Supabase constraint errors
        if (userError.code === '23505') {
          if (userError.message.includes('phone_number')) {
            throw new Error('This phone number is already registered.');
          } else if (userError.message.includes('username')) {
            throw new Error('This username is already taken.');
          } else if (userError.message.includes('email')) {
            throw new Error('This email is already registered.');
          } else {
            throw new Error('An account with these details already exists.');
          }
        }
        
        throw new Error(userError.message || 'Failed to create account');
      }

      // If user used a referral code, find the referring user and update their stats
      if (data.referralCode) {
        try {
          const { data: referringUser, error: referralError } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('referral_code', data.referralCode)
            .single();

          if (referringUser && !referralError) {
            // Update the new user with the referring user's ID
            await supabase
              .from('users')
              .update({ referred_by_user_id: referringUser.id })
              .eq('id', userData.id);

            console.log('Referral connection established with user:', referringUser.full_name);
            
            // Optional: Add bonus rewards or create notification for successful referral
            // This can be implemented later based on business requirements
          } else {
            console.warn('Referral code not found:', data.referralCode);
          }
        } catch (error) {
          console.error('Error processing referral:', error);
          // Don't fail signup if referral processing fails
        }
      }

      const typedUser: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        username: userData.username,
        phone_number: userData.phone_number,
        profile_image_url: userData.profile_image_url,
        available_balance: userData.available_balance,
        total_deposits: userData.total_deposits,
        total_withdrawals: userData.total_withdrawals,
        current_plan_id: userData.current_plan_id,
        account_status: userData.account_status,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        referral_code: userData.referral_code,
        totalReferrals: 0,
        user_level: 1,
        levelInfo: {
          name: 'Level 1',
          description: 'Basic user level',
          color: 'blue',
          benefits: ['Basic access', 'No referral bonus'],
          bonus_amount: 0
        }
      };
      
      setUser(typedUser);
      localStorage.setItem('user', JSON.stringify(typedUser));
      return { success: true, user: typedUser };
    } catch (error: any) {
      console.error('Signup failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: any) => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*');
      
      // Determine if login input is email or username
      const isEmail = data.emailOrUsername.includes('@');
      
      if (isEmail) {
        query = query.eq('email', data.emailOrUsername);
      } else {
        query = query.eq('username', data.emailOrUsername);
      }
      
      const { data: userData, error: lookupError } = await query.single();

      if (lookupError || !userData) {
        console.error('User lookup error:', lookupError);
        throw new Error(`${isEmail ? 'Email' : 'Username'} not found`);
      }

      console.log('Found user:', userData);

      // Check account status before password verification
      if (userData.account_status === 'suspended') {
        throw new Error('Your account has been suspended. Please contact support for assistance.');
      }
      
      if (userData.account_status === 'banned') {
        throw new Error('Your account has been banned. Please contact support for assistance.');
      }

      // Verify password (plain text comparison for now)
      if (userData.password !== data.password) {
        throw new Error('Invalid password');
      }

      // Get referral count
      const { count: referralCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('referred_by_user_id', userData.id);

      // Calculate user level based on referrals
      const calculateUserLevel = (referrals: number): number => {
        if (referrals >= 100) return 10;
        if (referrals >= 75) return 9;
        if (referrals >= 50) return 8;
        if (referrals >= 40) return 7;
        if (referrals >= 30) return 6;
        if (referrals >= 25) return 5;
        if (referrals >= 20) return 4;
        if (referrals >= 10) return 3;
        if (referrals >= 3) return 2;
        return 1;
      };

      const typedUser: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        username: userData.username,
        phone_number: userData.phone_number,
        profile_image_url: userData.profile_image_url,
        available_balance: userData.available_balance,
        total_deposits: userData.total_deposits,
        total_withdrawals: userData.total_withdrawals,
        current_plan_id: userData.current_plan_id,
        account_status: userData.account_status,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        referral_code: userData.referral_code,
        totalReferrals: referralCount || 0,
        user_level: calculateUserLevel(referralCount || 0),
        levelInfo: {
          name: 'Level 1',
          description: 'Basic user level',
          color: 'blue',
          benefits: ['Basic access', 'No referral bonus'],
          bonus_amount: 0
        }
      };
      
      setUser(typedUser);
      localStorage.setItem('user', JSON.stringify(typedUser));
      localStorage.setItem('currentUser', JSON.stringify(typedUser));
      console.log('Login successful:', typedUser);
      return typedUser;
    } catch (error: any) {
      console.error('Signin failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      console.log('Signing out user...');
      
      // Clear all user data immediately
      setUser(null);
      clearAllStoredData();
      
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Signout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription to listen for user balance changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel('user-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time user data updated:', payload);
          
          // Check if account status changed to non-active
          if (payload.new && (payload.new as any).account_status !== 'active') {
            console.log('Account status changed to non-active, signing out user');
            signOut();
            return;
          }
          
          if (payload.new && typeof (payload.new as any).available_balance === 'number') {
            setUser(prevUser => {
              if (prevUser) {
                const updatedUser: User = {
                  ...prevUser,
                  available_balance: (payload.new as any).available_balance,
                  total_deposits: (payload.new as any).total_deposits || prevUser.total_deposits,
                  total_withdrawals: (payload.new as any).total_withdrawals || prevUser.total_withdrawals,
                  current_plan_id: (payload.new as any).current_plan_id,
                  account_status: (payload.new as any).account_status || prevUser.account_status,
                  updated_at: (payload.new as any).updated_at || prevUser.updated_at
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('User context updated with new balance:', updatedUser.available_balance);
                return updatedUser;
              }
              return prevUser;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
