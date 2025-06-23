
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Gift, Percent, DollarSign, Settings, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface ReferralSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
}

interface LevelCommission {
  level: number;
  percentage: string;
}

const AdminReferralSettings = () => {
  const [settings, setSettings] = useState<ReferralSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levelCommissions, setLevelCommissions] = useState<LevelCommission[]>([
    { level: 1, percentage: '5.00' }
  ]);

  useEffect(() => {
    fetchReferralSettings();
  }, []);

  const fetchReferralSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      
      console.log('Fetched settings:', data);
      setSettings(data || []);
      
      // Load level commissions from settings
      const levelsData = data?.find(s => s.setting_key === 'referral_level_commissions');
      if (levelsData?.setting_value) {
        try {
          const parsedLevels = JSON.parse(levelsData.setting_value);
          setLevelCommissions(parsedLevels);
        } catch (e) {
          console.error('Error parsing level commissions:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      toast.error('Failed to load referral settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    console.log('Updating setting:', key, 'to:', value);
    setSettings(prev => {
      const existingSetting = prev.find(setting => setting.setting_key === key);
      if (existingSetting) {
        return prev.map(setting => 
          setting.setting_key === key 
            ? { ...setting, setting_value: value }
            : setting
        );
      } else {
        // Create new setting if it doesn't exist
        const newSetting: ReferralSetting = {
          id: `temp-${Date.now()}`,
          setting_key: key,
          setting_value: value,
          setting_type: 'string',
          description: ''
        };
        return [...prev, newSetting];
      }
    });
  };

  const addLevel = () => {
    const newLevel = levelCommissions.length + 1;
    setLevelCommissions(prev => [...prev, { level: newLevel, percentage: '0.00' }]);
  };

  const removeLevel = (levelToRemove: number) => {
    if (levelCommissions.length > 1) {
      setLevelCommissions(prev => 
        prev.filter(level => level.level !== levelToRemove)
          .map((level, index) => ({ ...level, level: index + 1 }))
      );
    }
  };

  const updateLevelCommission = (level: number, percentage: string) => {
    setLevelCommissions(prev => 
      prev.map(item => 
        item.level === level ? { ...item, percentage } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving settings:', settings);

      // Update max levels based on current level commissions
      updateSetting('referral_max_levels', levelCommissions.length.toString());

      // Prepare updates and inserts
      const updates = [];
      const inserts = [];

      for (const setting of settings) {
        if (setting.id.startsWith('temp-')) {
          // This is a new setting
          inserts.push({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            setting_type: setting.setting_type || 'string',
            description: setting.description || ''
          });
        } else {
          // This is an existing setting
          updates.push({
            id: setting.id,
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString()
          });
        }
      }

      // Insert new settings
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('referral_settings')
          .insert(inserts);
        if (insertError) throw insertError;
      }

      // Update existing settings
      for (const update of updates) {
        const { error } = await supabase
          .from('referral_settings')
          .update({ setting_value: update.setting_value, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Save or update level commissions
      const levelCommissionsData = JSON.stringify(levelCommissions);
      const existingLevelSetting = settings.find(s => s.setting_key === 'referral_level_commissions');
      
      if (existingLevelSetting && !existingLevelSetting.id.startsWith('temp-')) {
        const { error } = await supabase
          .from('referral_settings')
          .update({ 
            setting_value: levelCommissionsData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLevelSetting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('referral_settings')
          .insert({
            setting_key: 'referral_level_commissions',
            setting_value: levelCommissionsData,
            setting_type: 'string',
            description: 'Commission percentages for each referral level'
          });
        if (error) throw error;
      }

      toast.success('Referral settings updated successfully');
      fetchReferralSettings(); // Refresh the data
    } catch (error) {
      console.error('Error updating referral settings:', error);
      toast.error('Failed to update referral settings');
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key);
  };

  const getSettingValue = (key: string) => {
    return getSetting(key)?.setting_value || '';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Settings</h1>
            <p className="text-gray-600 mt-2">Configure referral system parameters and bonuses</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-600" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system_enabled">Enable Referral System</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="system_enabled"
                    checked={getSettingValue('referral_system_enabled') === 'true'}
                    onCheckedChange={(checked) => 
                      updateSetting('referral_system_enabled', checked.toString())
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {getSettingValue('referral_system_enabled') === 'true' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enable_signup_bonus">Enable Signup Bonus</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_signup_bonus"
                    checked={getSettingValue('enable_signup_bonus') === 'true'}
                    onCheckedChange={(checked) => 
                      updateSetting('enable_signup_bonus', checked.toString())
                    }
                  />
                  <span className="text-sm text-gray-600">
                    Give bonus on signup with referral code
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📈 Deposit Commission</h4>
                <p className="text-sm text-blue-700">
                  When the referral system is enabled, users will automatically receive commission when their referred users make deposits based on the level-based commission configuration below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2 text-emerald-600" />
                Basic Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup_bonus">New User Signup Bonus (Rs.)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="signup_bonus"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={getSettingValue('referral_signup_bonus')}
                    onChange={(e) => updateSetting('referral_signup_bonus', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">💰 Commission System</h4>
                <p className="text-sm text-green-700">
                  Commission rates are determined by the Level Commission Configuration below. 
                  When referral system is enabled, each referral level will earn commission based on their configured percentage when referred users make deposits.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Level Commission Configuration */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-emerald-600" />
                  Level Commission Configuration
                </div>
                <Button onClick={addLevel} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Level
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {levelCommissions.map((level) => (
                  <div key={level.level} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <span className="font-medium">Level {level.level}</span>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="pl-10"
                          value={level.percentage}
                          onChange={(e) => updateLevelCommission(level.level, e.target.value)}
                          placeholder="Commission %"
                        />
                      </div>
                    </div>
                    {levelCommissions.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Level {level.level}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this commission level? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeLevel(level.level)}>
                              Remove Level
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Configure commission percentages for each referral level. Level 1 is direct referrals, Level 2 is referrals of referrals, etc.
                These percentages will be applied when referred users make deposits (only when referral system is enabled).
              </p>
            </CardContent>
          </Card>

          {/* Settings Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Settings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">System Status:</span>
                  <span className={`font-medium ${
                    getSettingValue('referral_system_enabled') === 'true' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {getSettingValue('referral_system_enabled') === 'true' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signup Bonus:</span>
                  <span className={`font-medium ${
                    getSettingValue('enable_signup_bonus') === 'true' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {getSettingValue('enable_signup_bonus') === 'true' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Commission:</span>
                  <span className={`font-medium ${
                    getSettingValue('referral_system_enabled') === 'true' 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                  }`}>
                    {getSettingValue('referral_system_enabled') === 'true' ? 'Level-Based (Auto)' : 'System Disabled'}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-gray-600">Commission Rates:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    Signup: Rs. {getSettingValue('referral_signup_bonus') || '0'}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    Deposit Commission: {levelCommissions.length} levels configured
                  </span>
                  {levelCommissions.map((level, index) => (
                    <span key={level.level} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      L{level.level}: {level.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReferralSettings;
