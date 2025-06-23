import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Upload, Save, Image, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface SystemSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
}

const AdminGeneralSettings = () => {
  const { settings: systemSettings, loading: systemSettingsLoading } = useSystemSettings();
  const [settings, setSettings] = useState<Record<string, string | boolean | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Karachi', label: 'Pakistan Time (PKT)' },
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (BST)' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' }
  ];

  const timeFormats = [
    { value: '12', label: '12-hour format (12:30 PM)' },
    { value: '24', label: '24-hour format (12:30)' }
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/12/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-25)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (25-12-2024)' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value, setting_type')
        .in('category', ['general', 'imagekit']);

      if (error) throw error;

      const settingsMap: Record<string, string | boolean | number> = {};
      data?.forEach((setting: SystemSetting) => {
        let value: string | boolean | number = setting.setting_value || '';
        if (setting.setting_type === 'boolean') {
          value = setting.setting_value === 'true';
        } else if (setting.setting_type === 'number') {
          value = parseFloat(setting.setting_value || '0');
        }
        settingsMap[setting.setting_key] = value;
      });

      // Set default values for system configuration if they don't exist
      if (!settingsMap.hasOwnProperty('maintenance_mode')) {
        settingsMap['maintenance_mode'] = false;
      }
      if (!settingsMap.hasOwnProperty('registration_enabled')) {
        settingsMap['registration_enabled'] = true;
      }
      if (!settingsMap.hasOwnProperty('site_name')) {
        settingsMap['site_name'] = 'EasyPaisa';
      }
      if (!settingsMap.hasOwnProperty('default_currency_code')) {
        settingsMap['default_currency_code'] = 'PKR';
      }
      if (!settingsMap.hasOwnProperty('timezone')) {
        settingsMap['timezone'] = 'Asia/Karachi';
      }
      if (!settingsMap.hasOwnProperty('time_format')) {
        settingsMap['time_format'] = '12';
      }
      if (!settingsMap.hasOwnProperty('date_format')) {
        settingsMap['date_format'] = 'DD/MM/YYYY';
      }

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Auto-update currency symbol when currency code changes
    if (field === 'default_currency_code' && typeof value === 'string') {
      const currency = systemSettings.supportedCurrencies[value];
      if (currency) {
        setSettings(prev => ({ ...prev, default_currency_symbol: currency.symbol }));
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === 'boolean' ? value.toString() : value.toString(),
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        // Check if setting exists
        const { data: existingSetting, error: checkError } = await supabase
          .from('system_settings')
          .select('id')
          .eq('setting_key', update.setting_key)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingSetting) {
          // Update existing setting
          const { error } = await supabase
            .from('system_settings')
            .update({ 
              setting_value: update.setting_value,
              updated_at: update.updated_at 
            })
            .eq('setting_key', update.setting_key);

          if (error) throw error;
        } else {
          // Insert new setting
          const { error } = await supabase
            .from('system_settings')
            .insert({
              setting_key: update.setting_key,
              setting_value: update.setting_value,
              setting_type: typeof settings[update.setting_key] === 'boolean' ? 'boolean' : 'string',
              category: 'general',
              created_at: update.updated_at,
              updated_at: update.updated_at
            });

          if (error) throw error;
        }
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getStringValue = (key: string): string => {
    const value = settings[key];
    return typeof value === 'string' ? value : '';
  };

  const getBooleanValue = (key: string): boolean => {
    const value = settings[key];
    return typeof value === 'boolean' ? value : false;
  };

  if (loading || systemSettingsLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600">Configure your application settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={getStringValue('site_name')}
                  onChange={(e) => handleInputChange('site_name', e.target.value)}
                  placeholder="Enter your website name"
                />
              </div>
              <div>
                <Label htmlFor="site_description">Site Description</Label>
                <Input
                  id="site_description"
                  value={getStringValue('site_description')}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={getStringValue('support_email')}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={getStringValue('phone_number')}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={getStringValue('address')}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Currency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="default_currency_code">Default Currency</Label>
                <Select
                  value={getStringValue('default_currency_code')}
                  onValueChange={(value) => handleInputChange('default_currency_code', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(systemSettings.supportedCurrencies).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {info.name} ({info.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="default_currency_symbol">Currency Symbol</Label>
                <Input
                  id="default_currency_symbol"
                  value={getStringValue('default_currency_symbol') || systemSettings.currencySymbol}
                  onChange={(e) => handleInputChange('default_currency_symbol', e.target.value)}
                  placeholder="Currency symbol (e.g., $, Rs., ₹)"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={getStringValue('timezone')}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time_format">Time Format</Label>
                <Select
                  value={getStringValue('time_format')}
                  onValueChange={(value) => handleInputChange('time_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time format" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={getStringValue('date_format')}
                  onValueChange={(value) => handleInputChange('date_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Preview:</strong> {getStringValue('default_currency_symbol') || systemSettings.currencySymbol} 1,000
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Put site in maintenance mode</p>
                </div>
                <Switch
                  checked={getBooleanValue('maintenance_mode')}
                  onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>User Registration</Label>
                  <p className="text-sm text-gray-500">Allow new user registrations</p>
                </div>
                <Switch
                  checked={getBooleanValue('registration_enabled')}
                  onCheckedChange={(checked) => handleInputChange('registration_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                ImageKit Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imagekit_id">ImageKit ID</Label>
                <Input
                  id="imagekit_id"
                  value={getStringValue('imagekit_id')}
                  onChange={(e) => handleInputChange('imagekit_id', e.target.value)}
                  placeholder="Your ImageKit ID"
                />
              </div>
              <div>
                <Label htmlFor="imagekit_public_key">Public Key</Label>
                <Input
                  id="imagekit_public_key"
                  value={getStringValue('imagekit_public_key')}
                  onChange={(e) => handleInputChange('imagekit_public_key', e.target.value)}
                  placeholder="Your ImageKit public key"
                />
              </div>
              <div>
                <Label htmlFor="imagekit_private_key">Private Key</Label>
                <Input
                  id="imagekit_private_key"
                  type="password"
                  value={getStringValue('imagekit_private_key')}
                  onChange={(e) => handleInputChange('imagekit_private_key', e.target.value)}
                  placeholder="Your ImageKit private key"
                />
              </div>
              <div>
                <Label htmlFor="imagekit_url_endpoint">URL Endpoint</Label>
                <Input
                  id="imagekit_url_endpoint"
                  value={getStringValue('imagekit_url_endpoint')}
                  onChange={(e) => handleInputChange('imagekit_url_endpoint', e.target.value)}
                  placeholder="https://ik.imagekit.io/your_imagekit_id"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> ImageKit credentials are used for image upload and management. 
                  Get your credentials from your ImageKit dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Logo</Label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
              <div>
                <Label>Favicon</Label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-3 h-3 mr-2" />
                    Upload Favicon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="flex items-center"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGeneralSettings;
