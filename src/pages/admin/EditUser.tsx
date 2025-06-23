import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Shield, DollarSign } from 'lucide-react';
import toastService from '@/services/toastService';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getCurrencyDisplay } from '@/lib/utils';

const EditUser = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    is_email_verified: false,
    is_phone_verified: false,
    city: '',
    postal_code: ''
  });

  // Validate userId parameter
  useEffect(() => {
    console.log('EditUser - userId from params:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid userId detected:', userId);
      toastService.error("Invalid user ID. Redirecting to users list.");
      navigate('/admin/users');
      return;
    }

    fetchUserData();
  }, [userId, navigate]);

  const fetchUserData = async () => {
    if (!userId || userId === 'undefined') return;
    
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
        setUserData({
          full_name: user.full_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          country: user.country || 'Pakistan',
          address: user.address || '',
          account_status: user.account_status || 'active',
          kyc_status: user.kyc_status || 'not_submitted',
          available_balance: user.available_balance || 0,
          is_email_verified: user.is_email_verified || false,
          is_phone_verified: user.is_phone_verified || false,
          city: user.city || '',
          postal_code: user.postal_code || ''
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

  if (!userId || userId === 'undefined') {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>Invalid user ID. Redirecting...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/users/${userId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to User Details
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Modify user information and settings</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
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

          {/* Account Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Account Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_email_verified">Email Verified</Label>
                    <Switch
                      id="is_email_verified"
                      checked={userData.is_email_verified}
                      onCheckedChange={(checked) => handleInputChange('is_email_verified', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_phone_verified">Phone Verified</Label>
                    <Switch
                      id="is_phone_verified"
                      checked={userData.is_phone_verified}
                      onCheckedChange={(checked) => handleInputChange('is_phone_verified', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Balance Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="text-sm text-gray-600">
                  <p>Use caution when manually adjusting balances. All changes are logged.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
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
    </AdminLayout>
  );
};

export default EditUser;
