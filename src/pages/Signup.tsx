import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle, Shield, Star, Users, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import toastService from '@/services/toastService';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { getReferralSettings } from '@/utils/referralCommission';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError] = useState('');
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    username: '',
    password: '',
    email: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  
  const form = useForm({
    defaultValues: {
      phoneNumber: '',
      withdrawPin: '',
      fullName: '',
      username: '',
      password: '',
      email: '',
      referralCode: '',
    },
  });

  // Check for referral code in URL on component mount
  useEffect(() => {
    const checkReferralFromUrl = () => {
      // Check URL search params for referral code
      const urlParams = new URLSearchParams(location.search);
      const refParam = urlParams.get('ref');
      
      if (refParam && !referralCode) {
        setReferralCode(refParam);
        setIsReferralFromUrl(true);
        form.setValue('referralCode', refParam);
        toastService.success(`Referral code ${refParam} applied!`);
      }
      
      // Also check if current path contains /ref/ (fallback)
      const pathParts = location.pathname.split('/');
      const refIndex = pathParts.indexOf('ref');
      
      if (refIndex !== -1 && pathParts[refIndex + 1] && !refParam) {
        const urlReferralCode = pathParts[refIndex + 1];
        setReferralCode(urlReferralCode);
        setIsReferralFromUrl(true);
        form.setValue('referralCode', urlReferralCode);
        toastService.success(`Referral code ${urlReferralCode} applied!`);
      }
    };

    checkReferralFromUrl();
  }, [location, form, referralCode]);

  const onSubmitPhone = (data: any) => {
    setPhoneError(''); // Clear previous errors
    
    if (!data.phoneNumber || data.phoneNumber.trim() === '') {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    
    if (data.phoneNumber.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
      return;
    }
    
    console.log('Phone submitted:', data.phoneNumber);
    setPhoneNumber(data.phoneNumber);
    setStep(2);
    toastService.success('Phone number verified! Please set your PIN');
  };

  const onSubmitPin = (data: any) => {
    setPinError(''); // Clear previous errors
    
    if (!data.withdrawPin || data.withdrawPin.trim() === '') {
      setPinError('Please enter a 4-digit PIN');
      return;
    }
    
    if (data.withdrawPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    
    if (!/^\d+$/.test(data.withdrawPin)) {
      setPinError('PIN must contain only numbers');
      return;
    }
    
    console.log('PIN submitted:', data.withdrawPin);
    setWithdrawPin(data.withdrawPin);
    setStep(3);
    toastService.success('PIN set successfully! Complete your profile');
  };

  const onSubmitDetails = async (data: any) => {
    // Clear previous errors
    setFormErrors({
      fullName: '',
      username: '',
      password: '',
      email: ''
    });

    // Validate required fields
    if (!data.fullName || data.fullName.trim() === '') {
      setFormErrors(prev => ({ ...prev, fullName: 'Please enter your full name' }));
      return;
    }
    
    if (!data.username || data.username.trim() === '') {
      setFormErrors(prev => ({ ...prev, username: 'Please enter a username' }));
      return;
    }
    
    if (!data.password || data.password.trim() === '') {
      setFormErrors(prev => ({ ...prev, password: 'Please enter a password' }));
      return;
    }
    
    if (data.password.length < 6) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters long' }));
      return;
    }
    
    // Validate email if provided
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const userData = {
        phoneNumber,
        withdrawPin,
        referralCode: data.referralCode || referralCode,
        ...data
      };

      console.log('Attempting to create account with data:', {
        ...userData,
        password: '[HIDDEN]',
        withdrawPin: '[HIDDEN]'
      });

      const result = await signUp(userData);

      if (!result.success) {
        console.error('Signup error:', result.error);
        
        // Display user-friendly error messages with inline field errors
        if (result.error.includes('phone number') || result.error.includes('Phone')) {
          setPhoneError('This phone number is already registered. Please use a different phone number.');
          setStep(1); // Go back to phone step
          toastService.error('This phone number is already registered. Please use a different phone number.');
        } else if (result.error.includes('username') || result.error.includes('Username')) {
          setFormErrors(prev => ({ ...prev, username: 'This username is already taken. Please choose another one.' }));
          toastService.error('This username is already taken. Please choose another one.');
        } else if (result.error.includes('email') || result.error.includes('Email')) {
          setFormErrors(prev => ({ ...prev, email: 'This email is already registered. Please use a different email.' }));
          toastService.error('This email is already registered. Please use a different email.');
        } else if (result.error.includes('duplicate') || result.error.includes('unique')) {
          toastService.error('An account with these details already exists.');
        } else {
          toastService.error(result.error || 'Failed to create account. Please try again.');
        }
        
        setIsLoading(false);
        return;
      }

      // Process signup bonus for ALL new users (not just those with referral codes)
      if (result.user?.id) {
        console.log('🎯 Processing signup bonus for new user:', result.user.id);
        
        try {
          // Get referral settings first
          const settings = await getReferralSettings();
          console.log('📋 Referral settings:', settings);
          
          if (settings.enableSignupBonus && settings.signupBonus > 0) {
            console.log('🎁 Adding signup bonus to new user account:', settings.signupBonus);
            
            // Get current balance of the new user
            const { data: newUserData, error: fetchError } = await supabase
              .from('users')
              .select('available_balance')
              .eq('id', result.user.id)
              .single();

            if (fetchError) {
              console.error('❌ Error fetching new user balance:', fetchError);
            } else {
              const newBalance = (newUserData.available_balance || 0) + settings.signupBonus;

              // Add signup bonus to new user's balance
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  available_balance: newBalance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', result.user.id);

              if (updateError) {
                console.error('❌ Error updating new user balance:', updateError);
              } else {
                console.log('✅ Updated new user balance:', { newBalance, bonusAmount: settings.signupBonus });

                // Create transaction record for the signup bonus
                const bonusDescription = userData.referralCode 
                  ? `Welcome bonus for signing up with referral code - Rs. ${settings.signupBonus}`
                  : `Welcome bonus for new account registration - Rs. ${settings.signupBonus}`;

                const { error: transactionError } = await supabase
                  .from('transactions')
                  .insert({
                    user_id: result.user.id,
                    type: 'signup_bonus',
                    amount: settings.signupBonus,
                    status: 'completed',
                    description: bonusDescription,
                    reference_type: 'signup_bonus',
                    reference_id: result.user.id
                  });

                if (transactionError) {
                  console.error('❌ Error creating signup bonus transaction:', transactionError);
                } else {
                  console.log('✅ Signup bonus transaction created successfully');
                }

                // Create notification for new user
                try {
                  const notificationMessage = userData.referralCode
                    ? `Congratulations! You received Rs. ${settings.signupBonus} as a welcome bonus for joining with a referral code!`
                    : `Welcome to Easypaisa! You received Rs. ${settings.signupBonus} as a welcome bonus for creating your account!`;

                  await supabase.rpc('create_user_activity_notification', {
                    p_user_id: result.user.id,
                    p_type: 'signup_bonus',
                    p_title: 'Welcome Bonus Received!',
                    p_message: notificationMessage,
                    p_icon: '🎉',
                    p_priority: 'high',
                    p_metadata: {
                      bonus_amount: settings.signupBonus,
                      referral_code: userData.referralCode || null,
                      signup_type: userData.referralCode ? 'with_referral' : 'direct'
                    }
                  });
                } catch (notificationError) {
                  console.error('⚠️ Failed to create signup bonus notification:', notificationError);
                }

                toastService.success(`Welcome! You received Rs. ${settings.signupBonus} as a signup bonus!`);
              }
            }
          } else {
            console.log('ℹ️ Signup bonus is disabled or amount is 0');
            
            // Still show welcome message even if no bonus
            if (!settings.enableSignupBonus) {
              console.log('ℹ️ Signup bonus feature is disabled in admin settings');
            }
          }
        } catch (error) {
          console.error('❌ Error processing signup bonus:', error);
          // Don't block signup if bonus processing fails
        }
      }

      toastService.success('Account created successfully! Welcome to Easypaisa');
      console.log('✅ Account created successfully, redirecting to login...');
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      // This catch block should rarely be reached now since signUp returns success/error object
      console.error('Unexpected signup error:', error);
      
      // Check if it's one of our known error types even in the catch block
      const errorMessage = error?.message || '';
      if (errorMessage.includes('phone number') || errorMessage.includes('Phone')) {
        setPhoneError('This phone number is already registered. Please use a different phone number.');
        setStep(1); // Go back to phone step
        toastService.error('This phone number is already registered. Please use a different phone number.');
      } else if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        setFormErrors(prev => ({ ...prev, username: 'This username is already taken. Please choose another one.' }));
        toastService.error('This username is already taken. Please choose another one.');
      } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setFormErrors(prev => ({ ...prev, email: 'This email is already registered. Please use a different email.' }));
        toastService.error('This email is already registered. Please use a different email.');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toastService.error('An account with these details already exists.');
      } else {
        toastService.error('Failed to create account. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const togglePinVisibility = () => setShowPin(!showPin);

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      toastService.info('Returning to previous step');
    }
  };

  const skipReferral = () => {
    form.setValue('referralCode', '');
    setReferralCode('');
    toastService.info('Referral code cleared');
  };

  const benefits = [
    "No hidden fees or charges",
    "24/7 customer support",
    "Earn rewards on every transaction",
    "Pay bills and shop online easily",
    "Access to exclusive offers"
  ];

  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 relative overflow-hidden">
        {/* Decorative background elements - simplified for performance */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-emerald-400/20 to-green-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        {/* Header with progress - compact */}
        <div className="relative z-10 flex-shrink-0">
          <div className="flex justify-between items-center px-4 pt-4 pb-2">
            {step > 1 && (
              <button 
                onClick={goBack} 
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all duration-200"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
            <div className="flex-1"></div>
            <Link 
              to="/login" 
              className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-green-600 font-medium text-sm shadow-lg border border-green-100 hover:bg-white/90 transition-all duration-200"
            >
              Login
            </Link>
          </div>
          
          {/* Progress bar - compact */}
          <div className="px-4 pb-2">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      stepNum < step 
                        ? 'bg-green-600 text-white' 
                        : stepNum === step 
                        ? 'bg-green-600 text-white ring-2 ring-green-200' 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {stepNum < step ? <CheckCircle size={14} /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div 
                      className={`w-6 h-0.5 mx-1 rounded-full transition-all duration-300 ${
                        stepNum < step ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-1">
              <p className="text-xs text-gray-600">
                {step === 1 && "Verify phone number"}
                {step === 2 && "Set security PIN"}
                {step === 3 && "Complete profile"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content area - scrollable with proper constraints */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-4">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Phone size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to <span className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 bg-clip-text text-transparent">Easypaisa</span>
                </h1>
                <p className="text-gray-600 text-sm mb-4">
                  Pakistan's most trusted digital wallet
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <form onSubmit={form.handleSubmit(onSubmitPhone)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Input 
                        type="tel"
                        placeholder="03XXXXXXXXX" 
                        {...form.register('phoneNumber', { required: true })} 
                        className="pl-12 h-12 text-base rounded-xl border-2 border-green-100 focus:border-green-500 focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200" 
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                        <Phone size={18} />
                      </div>
                    </div>
                    {phoneError && (
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        {phoneError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      We'll send you a verification code to confirm your number
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  >
                    Continue to Verification
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Step 2: Withdraw PIN */}
          {step === 2 && (
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-4">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Shield size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Secure Your <span className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 bg-clip-text text-transparent">Account</span>
                </h1>
                <p className="text-gray-600 text-sm mb-3">
                  Create a 4-digit PIN for secure transactions
                </p>
                
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 rounded-xl p-3 mb-4 border border-green-200/50">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Why we need a PIN?</h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      <p className="text-xs text-gray-700">Protect money from unauthorized access</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      <p className="text-xs text-gray-700">Secure transactions and withdrawals</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      <p className="text-xs text-gray-700">Bank-level security standards</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <form onSubmit={form.handleSubmit(onSubmitPin)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      Withdraw PIN
                    </label>
                    <div className="relative">
                      <Input 
                        type={showPin ? "text" : "password"}
                        placeholder="••••" 
                        maxLength={4}
                        {...form.register('withdrawPin', { required: true, minLength: 4, maxLength: 4 })} 
                        className="pl-12 pr-12 h-12 text-base text-center tracking-[0.5rem] rounded-xl border-2 border-green-100 focus:border-green-500 focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200" 
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                        <Lock size={18} />
                      </div>
                      <button 
                        type="button" 
                        onClick={togglePinVisibility} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pinError && (
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        {pinError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      Choose a PIN that's easy to remember but hard to guess
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  >
                    Set PIN & Continue
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Complete Profile */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <User size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Complete Your <span className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 bg-clip-text text-transparent">Profile</span>
                </h1>
                <p className="text-gray-600 text-sm mb-3">
                  Just a few more details to get started
                </p>
                
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 rounded-xl p-3 mb-3 border border-green-200/50">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center justify-center">
                    <Star className="mr-1 text-green-600" size={16} />
                    What you get with Easypaisa
                  </h3>
                  <div className="space-y-1">
                    {benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                        <p className="text-xs text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
                <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">
                        Full Name
                      </label>
                      <div className="relative">
                        <Input 
                          type="text"
                          placeholder="Enter your full name" 
                          {...form.register('fullName', { required: true })} 
                          className={`pl-10 h-10 text-sm rounded-lg border-2 ${
                            formErrors.fullName ? 'border-red-500 focus:border-red-500' : 'border-green-100 focus:border-green-500'
                          } focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200`} 
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <User size={16} />
                        </div>
                      </div>
                      {formErrors.fullName && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">
                        Username
                      </label>
                      <div className="relative">
                        <Input 
                          type="text"
                          placeholder="Choose a unique username" 
                          {...form.register('username', { required: true })} 
                          className={`pl-10 h-10 text-sm rounded-lg border-2 ${
                            formErrors.username ? 'border-red-500 focus:border-red-500' : 'border-green-100 focus:border-green-500'
                          } focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200`} 
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <User size={16} />
                        </div>
                      </div>
                      {formErrors.username && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {formErrors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">
                        Password
                      </label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password" 
                          {...form.register('password', { required: true })} 
                          className={`pl-10 pr-10 h-10 text-sm rounded-lg border-2 ${
                            formErrors.password ? 'border-red-500 focus:border-red-500' : 'border-green-100 focus:border-green-500'
                          } focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200`} 
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <Lock size={16} />
                        </div>
                        <button 
                          type="button" 
                          onClick={togglePasswordVisibility} 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">
                        Email (Optional)
                      </label>
                      <div className="relative">
                        <Input 
                          type="email"
                          placeholder="Enter your email for security" 
                          {...form.register('email')} 
                          className={`pl-10 h-10 text-sm rounded-lg border-2 ${
                            formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-green-100 focus:border-green-500'
                          } focus:ring-green-500/20 bg-white/70 backdrop-blur-sm transition-all duration-200`} 
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <User size={16} />
                        </div>
                      </div>
                      {formErrors.email && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 block">
                          Referral Code (Optional)
                        </label>
                        {referralCode && (
                          <button
                            type="button"
                            onClick={skipReferral}
                            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input 
                          type="text"
                          placeholder={isReferralFromUrl ? "Referral code applied!" : "Enter referral code"}
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value);
                            form.setValue('referralCode', e.target.value);
                          }}
                          className={`pl-10 h-10 text-sm rounded-lg border-2 ${
                            isReferralFromUrl 
                              ? 'border-green-300 bg-green-50/70 text-green-700' 
                              : 'border-green-100 bg-white/70'
                          } focus:border-green-500 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-200`}
                          readOnly={isReferralFromUrl}
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <Gift size={16} />
                        </div>
                        {isReferralFromUrl && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                            <CheckCircle size={16} />
                          </div>
                        )}
                      </div>
                      {isReferralFromUrl ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={10} />
                          Referral code automatically applied!
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Have a referral code? Enter it to earn bonus rewards!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Create My Account'}
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500">
                      By creating an account, you agree to our{' '}
                      <Link to="/terms" className="text-green-600 font-medium hover:text-green-700 transition-colors duration-200">
                        Terms & Conditions
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-green-600 font-medium hover:text-green-700 transition-colors duration-200">
                        Privacy Policy
                      </Link>
                    </p>
                    
                    <div className="flex justify-center items-center space-x-3 pt-2">
                      <div className="flex items-center space-x-1">
                        <Shield size={12} className="text-green-600" />
                        <span className="text-xs text-gray-600">Secure</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users size={12} className="text-green-600" />
                        <span className="text-xs text-gray-600">10M+ Users</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star size={12} className="text-green-600" />
                        <span className="text-xs text-gray-600">4.8 Rating</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Signup;
