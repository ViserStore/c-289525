
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Image, Key, Link as LinkIcon, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface ImageKitSettings {
  imagekit_id: string;
  imagekit_public_key: string;
  imagekit_private_key: string;
  imagekit_url_endpoint: string;
}

const AdminImageKitSettings = () => {
  const [settings, setSettings] = useState<ImageKitSettings>({
    imagekit_id: '',
    imagekit_public_key: '',
    imagekit_private_key: '',
    imagekit_url_endpoint: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['imagekit_id', 'imagekit_public_key', 'imagekit_private_key', 'imagekit_url_endpoint']);

      if (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch ImageKit settings');
        return;
      }

      const settingsObj: any = {};
      data?.forEach(item => {
        settingsObj[item.setting_key] = item.setting_value || '';
      });

      setSettings(settingsObj as ImageKitSettings);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while fetching settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (key: keyof ImageKitSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        setting_type: 'string',
        category: 'imagekit'
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ 
            setting_value: update.setting_value,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', update.setting_key);

        if (error) {
          console.error(`Error updating ${update.setting_key}:`, error);
          toast.error(`Failed to update ${update.setting_key}`);
          return;
        }
      }

      toast.success('ImageKit settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading ImageKit settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ImageKit Settings</h1>
          <p className="text-gray-600">Configure ImageKit integration for image storage</p>
        </div>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              ImageKit Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ImageKit ID */}
            <div className="space-y-2">
              <Label htmlFor="imagekit_id" className="flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                ImageKit ID
              </Label>
              <Input
                id="imagekit_id"
                value={settings.imagekit_id}
                onChange={(e) => handleInputChange('imagekit_id', e.target.value)}
                placeholder="e.g., 5tmp5zbf4"
                className="font-mono"
                disabled={saving}
              />
              <p className="text-sm text-gray-500">
                Your unique ImageKit ID (alphanumeric identifier)
              </p>
            </div>

            {/* Public Key */}
            <div className="space-y-2">
              <Label htmlFor="imagekit_public_key" className="flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Public Key
              </Label>
              <Input
                id="imagekit_public_key"
                value={settings.imagekit_public_key}
                onChange={(e) => handleInputChange('imagekit_public_key', e.target.value)}
                placeholder="Enter your ImageKit public key"
                className="font-mono"
                disabled={saving}
              />
              <p className="text-sm text-gray-500">
                Your ImageKit public key for client-side operations
              </p>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <Label htmlFor="imagekit_private_key" className="flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Private Key
              </Label>
              <Input
                id="imagekit_private_key"
                type="password"
                value={settings.imagekit_private_key}
                onChange={(e) => handleInputChange('imagekit_private_key', e.target.value)}
                placeholder="Enter your ImageKit private key"
                className="font-mono"
                disabled={saving}
              />
              <p className="text-sm text-gray-500">
                Your ImageKit private key for server-side operations (keep secure)
              </p>
            </div>

            {/* URL Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="imagekit_url_endpoint" className="flex items-center">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL Endpoint
              </Label>
              <Input
                id="imagekit_url_endpoint"
                value={settings.imagekit_url_endpoint}
                onChange={(e) => handleInputChange('imagekit_url_endpoint', e.target.value)}
                placeholder="https://ik.imagekit.io/your_imagekit_id"
                className="font-mono"
                disabled={saving}
              />
              <p className="text-sm text-gray-500">
                Your ImageKit URL endpoint for image delivery
              </p>
            </div>

            {/* Preview URL */}
            {settings.imagekit_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">URL Preview</h3>
                <p className="text-sm text-blue-700 font-mono">
                  https://ik.imagekit.io/{settings.imagekit_id}/path/to/image.jpg
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">How to get your ImageKit credentials:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
                <li>Go to <a href="https://imagekit.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ImageKit.io</a> and create an account</li>
                <li>Navigate to your Dashboard</li>
                <li>Go to Developer Options → API Keys</li>
                <li>Copy your Public Key, Private Key, and URL Endpoint</li>
                <li>Your ImageKit ID is visible in the URL endpoint</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminImageKitSettings;
