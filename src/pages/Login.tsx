
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '../components/AppLayout';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'username'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  
  const form = useForm({
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (values: any) => {
    console.log('Login attempt:', values);
    setIsLoading(true);

    try {
      // Use the signIn method from AuthContext
      const result = await signIn(values);
      console.log('Login successful:', result);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show specific error messages for account status issues
      if (error.message.includes('suspended')) {
        toast.error('Account suspended. Please contact support.');
      } else if (error.message.includes('banned')) {
        toast.error('Account banned. Please contact support.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const toggleLoginType = () => {
    setLoginType(loginType === 'email' ? 'username' : 'email');
    form.setValue('emailOrUsername', ''); // Clear the input when switching
  };

  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
        {/* Background decorative elements - optimized for small screens */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tl from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-green-300/10 to-emerald-300/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen w-full max-w-md mx-auto px-4">
          {/* Top section */}
          <div className="flex justify-between items-center pt-8 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-emerald-600 font-bold text-base sm:text-lg">Easypaisa</span>
            </div>
            <Link 
              to="/signup" 
              className="bg-white/80 backdrop-blur-sm px-4 py-2 sm:px-6 rounded-full text-emerald-600 font-medium text-xs sm:text-sm shadow-lg border border-emerald-100 hover:bg-white/90 transition-all duration-200 hover:scale-105"
            >
              Sign Up
            </Link>
          </div>
          
          {/* Welcome section */}
          <div className="pt-4 pb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-3xl mb-4 sm:mb-6 shadow-2xl">
                <Shield size={24} className="sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2 sm:mb-3">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-base sm:text-lg font-medium">
                Sign in to your account
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                Login with your {loginType === 'email' ? 'email' : 'username'} and password
              </p>
            </div>
          </div>
          
          {/* Login form */}
          <div className="flex-1 pb-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-white/20">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                        {loginType === 'email' ? 'Email Address' : 'Username'}
                      </label>
                      <button
                        type="button"
                        onClick={toggleLoginType}
                        className="text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                      >
                        Use {loginType === 'email' ? 'Username' : 'Email'}
                      </button>
                    </div>
                    <div className="relative">
                      <Input 
                        type={loginType === 'email' ? 'email' : 'text'}
                        placeholder={loginType === 'email' ? 'Enter your email' : 'Enter your username'} 
                        {...form.register('emailOrUsername', { 
                          required: `${loginType === 'email' ? 'Email' : 'Username'} is required` 
                        })} 
                        className="pl-10 sm:pl-12 h-12 sm:h-14 text-sm sm:text-lg bg-white/50 backdrop-blur-sm border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl sm:rounded-2xl shadow-sm" 
                        disabled={isLoading}
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {loginType === 'email' ? <Mail size={16} className="sm:w-5 sm:h-5" /> : <User size={16} className="sm:w-5 sm:h-5" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 block">
                      Password
                    </label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password" 
                        {...form.register('password', { 
                          required: 'Password is required' 
                        })} 
                        className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-12 sm:h-14 text-sm sm:text-lg bg-white/50 backdrop-blur-sm border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl sm:rounded-2xl shadow-sm" 
                        disabled={isLoading}
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <button 
                        type="button" 
                        onClick={togglePasswordVisibility} 
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 sm:pt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                      <span className="text-xs sm:text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-semibold py-4 sm:py-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span className="text-sm sm:text-base">{isLoading ? 'Signing in...' : 'Sign In'}</span>
                    {!isLoading && <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />}
                  </span>
                </Button>

                {/* Login Options Info */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm font-medium text-emerald-800 mb-1 sm:mb-2">Login Options</p>
                  <p className="text-xs text-emerald-600">
                    You can login with either your email address or username - your choice!
                  </p>
                </div>
                
                <p className="text-center text-xs text-gray-500 pt-2 sm:pt-4">
                  By signing in, you agree to our{' '}
                  <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-4 sm:mt-8">
              <p className="text-sm sm:text-base text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Login;
