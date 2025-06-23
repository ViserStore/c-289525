import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, User, Shield, DollarSign, Award } from 'lucide-react';
import toastService from '@/services/toastService';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings, getCurrencyDisplay } from '@/lib/utils';

const AdminEditUser = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const { settings: systemSettings, loading: systemSettingsLoading } = useSystemSettings();

  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    country: 'Pakistan',
    address: '',
    account_status: 'active',
    kyc_status: 'not_submitted',
    available_balance: 0,
    city: '',
    postal_code: '',
    user_level: 1,
    profile_image_url: ''
  });

  const calculateUserLevel = (referralCount: number): number => {
    if (referralCount >= 100) return 10;
    if (referralCount >= 75) return 9;
    if (referralCount >= 50) return 8;
    if (referralCount >= 40) return 7;
    if (referralCount >= 30) return 6;
    if (referralCount >= 25) return 5;
    if (referralCount >= 20) return 4;
    if (referralCount >= 10) return 3;
    if (referralCount >= 3) return 2;
    return 1;
  };

  const isValidUserId = (id: string | undefined): boolean => {
    if (!id) return false;
    if (id === 'undefined' || id === 'null' || id === '') return false;
    
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  useEffect(() => {
    // Validate userId before proceeding
    if (!isValidUserId(userId)) {
      console.error('Invalid userId in URL:', userId);
      toastService.error("Invalid user ID. Please check the URL.");
      navigate('/admin/users');
      return;
    }

    fetchUserData();
  }, [userId, navigate]);

  const fetchUserData = async () => {
    if (!isValidUserId(userId)) return;
    
    try {
      console.log('Fetching user data for ID:', userId);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        toastService.error("Failed to fetch user data.");
        return;
      }

      if (user) {
        console.log('User data fetched successfully:', user);
        
        // Get referral count
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('referred_by_user_id', userId);
        
        const referrals = count || 0;
        setReferralCount(referrals);
        const calculatedLevel = calculateUserLevel(referrals);
        
        setUserData({
          full_name: user.full_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          country: user.country || 'Pakistan',
          address: user.address || '',
          account_status: user.account_status || 'active',
          kyc_status: user.kyc_status || 'not_submitted',
          available_balance: user.available_balance || 0,
          city: user.city || '',
          postal_code: user.postal_code || '',
          user_level: calculatedLevel,
          profile_image_url: user.profile_image_url || ''
        });
      } else {
        console.log('No user found with ID:', userId);
        toastService.error("User not found.");
        navigate('/admin/users');
      }
    } catch (error) {
      console.error('Error:', error);
      toastService.error("An unexpected error occurred while fetching user data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...userData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        toastService.error("Failed to update user information.");
        return;
      }

      toastService.success("User information has been successfully updated.");
      navigate(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Error:', error);
      toastService.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading user data...</div>
        </div>
      </AdminLayout>
    );
  }

  const currencySymbol = getCurrencyDisplay(systemSettings);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50/30">
        {/* Header */}
        <div className="bg-white border-b border-gray-200/60 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" size="sm" className="w-fit" asChild>
                <Link to={`/admin/users/${userId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to User Details
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage 
                    src={userData.profile_image_url} 
                    alt={userData.full_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg bg-green-500 text-white">
                    {userData.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit User</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Modify user information and settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="shadow-sm border-gray-200/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={userData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={userData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={userData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pakistan">Pakistan</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={userData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={userData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={userData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Status & Level */}
            <Card className="shadow-sm border-gray-200/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Account Status & Level</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Level Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Current Level Status</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    User has <span className="font-bold">{referralCount} referrals</span>
                  </p>
                  <p className="text-sm text-blue-600">
                    Auto-calculated level: <span className="font-bold">Level {calculateUserLevel(referralCount)}</span>
                  </p>
                </div>

                <div>
                  <Label htmlFor="account_status">Account Status</Label>
                  <Select value={userData.account_status} onValueChange={(value) => handleInputChange('account_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kyc_status">KYC Status</Label>
                  <Select value={userData.kyc_status} onValueChange={(value) => handleInputChange('kyc_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="not_submitted">Not Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Balance Management */}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-3">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Balance Management</span>
                  </div>
                  <div>
                    <Label htmlFor="available_balance">Available Balance ({currencySymbol})</Label>
                    <Input
                      id="available_balance"
                      type="number"
                      step="0.01"
                      value={userData.available_balance}
                      onChange={(e) => handleInputChange('available_balance', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Use caution when manually adjusting balances. All changes are logged.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" asChild>
              <Link to={`/admin/users/${userId}`}>Cancel</Link>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEditUser;
