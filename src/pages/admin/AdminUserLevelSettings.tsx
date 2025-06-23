
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Award, Gift, Settings, Save, RefreshCw, Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings, getCurrencyDisplay } from '@/lib/utils';

interface LevelReward {
  id?: string;
  level: number;
  name: string;
  description: string;
  referrals_required: number;
  bonus_amount: number;
  benefits: string[];
  color: string;
  is_active?: boolean;
}

const AdminUserLevelSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levelRewards, setLevelRewards] = useState<LevelReward[]>([]);
  const { settings: currencySettings } = useSystemSettings();

  const [levelSystemSettings, setLevelSystemSettings] = useState({
    level_system_enabled: true,
    auto_level_calculation: true,
    reward_on_level_up: true,
    level_up_notifications: true
  });

  useEffect(() => {
    fetchLevelSettings();
  }, []);

  const fetchLevelSettings = async () => {
    try {
      console.log('Fetching level settings from database...');
      
      const { data: levelsData, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) {
        console.error('Error fetching levels:', error);
        toast.error('Failed to load level settings');
        return;
      }

      console.log('Fetched levels data:', levelsData);

      if (levelsData && levelsData.length > 0) {
        // Convert Json[] to string[] for benefits
        const convertBenefits = (benefits: any): string[] => {
          if (!benefits) return [];
          if (Array.isArray(benefits)) {
            return benefits.map(benefit => String(benefit));
          }
          return [];
        };

        const formattedLevels = levelsData.map(level => ({
          id: level.id,
          level: level.level,
          name: level.name,
          description: level.description || '',
          referrals_required: level.referrals_required,
          bonus_amount: Number(level.bonus_amount),
          benefits: convertBenefits(level.benefits),
          color: level.color,
          is_active: level.is_active
        }));
        
        setLevelRewards(formattedLevels);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching level settings:', error);
      toast.error('Failed to load level settings');
      setLoading(false);
    }
  };

  const updateLevelReward = (level: number, field: keyof LevelReward, value: any) => {
    setLevelRewards(prev => 
      prev.map(reward => 
        reward.level === level 
          ? { ...reward, [field]: value }
          : reward
      )
    );
  };

  const addBenefit = (level: number, benefit: string) => {
    if (!benefit.trim()) return;
    
    setLevelRewards(prev => 
      prev.map(reward => 
        reward.level === level 
          ? { ...reward, benefits: [...reward.benefits, benefit.trim()] }
          : reward
      )
    );
  };

  const removeBenefit = (level: number, benefitIndex: number) => {
    setLevelRewards(prev => 
      prev.map(reward => 
        reward.level === level 
          ? { ...reward, benefits: reward.benefits.filter((_, index) => index !== benefitIndex) }
          : reward
      )
    );
  };

  const addNewLevel = async () => {
    const newLevelNumber = levelRewards.length + 1;
    const newLevel: LevelReward = {
      level: newLevelNumber,
      name: `Level ${newLevelNumber}`,
      description: `Level ${newLevelNumber} description`,
      referrals_required: (newLevelNumber - 1) * 10,
      bonus_amount: newLevelNumber * 500,
      benefits: [`Level ${newLevelNumber} benefits`],
      color: "#6b7280",
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('user_levels')
        .insert([{
          level: newLevel.level,
          name: newLevel.name,
          description: newLevel.description,
          referrals_required: newLevel.referrals_required,
          bonus_amount: newLevel.bonus_amount,
          benefits: newLevel.benefits,
          color: newLevel.color,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding new level:', error);
        toast.error('Failed to add new level');
        return;
      }

      setLevelRewards(prev => [...prev, { ...newLevel, id: data.id }]);
      toast.success('New level added successfully');
    } catch (error) {
      console.error('Error adding new level:', error);
      toast.error('Failed to add new level');
    }
  };

  const removeLevel = async (level: number) => {
    if (levelRewards.length <= 1) {
      toast.error('Cannot remove the last level');
      return;
    }

    const levelToRemove = levelRewards.find(r => r.level === level);
    if (!levelToRemove?.id) {
      toast.error('Level ID not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_levels')
        .delete()
        .eq('id', levelToRemove.id);

      if (error) {
        console.error('Error removing level:', error);
        toast.error('Failed to remove level');
        return;
      }

      setLevelRewards(prev => 
        prev.filter(reward => reward.level !== level)
          .map((reward, index) => ({ ...reward, level: index + 1 }))
      );
      
      toast.success('Level removed successfully');
    } catch (error) {
      console.error('Error removing level:', error);
      toast.error('Failed to remove level');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving level settings:', levelRewards);
      
      // Update existing levels
      for (const level of levelRewards) {
        if (level.id) {
          const { error } = await supabase
            .from('user_levels')
            .update({
              name: level.name,
              description: level.description,
              referrals_required: level.referrals_required,
              bonus_amount: level.bonus_amount,
              benefits: level.benefits,
              color: level.color,
              is_active: level.is_active !== false,
              updated_at: new Date().toISOString()
            })
            .eq('id', level.id);

          if (error) {
            console.error('Error updating level:', error);
            toast.error(`Failed to update ${level.name}`);
            continue;
          }
        }
      }

      // Recalculate all user levels
      const { data: users } = await supabase
        .from('users')
        .select('id');

      if (users) {
        for (const user of users) {
          await supabase.rpc('calculate_user_level', { user_id: user.id });
        }
      }
      
      toast.success('Level settings saved successfully');
      await fetchLevelSettings(); // Refresh data
    } catch (error) {
      console.error('Error saving level settings:', error);
      toast.error('Failed to save level settings');
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">User Level & Rewards Settings</h1>
            <p className="text-gray-600 mt-2">Configure user levels, rewards, and progression system</p>
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
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-emerald-600" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Enable Level System</Label>
              <Switch
                checked={levelSystemSettings.level_system_enabled}
                onCheckedChange={(checked) => 
                  setLevelSystemSettings(prev => ({...prev, level_system_enabled: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Level Calculation</Label>
              <Switch
                checked={levelSystemSettings.auto_level_calculation}
                onCheckedChange={(checked) => 
                  setLevelSystemSettings(prev => ({...prev, auto_level_calculation: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Reward on Level Up</Label>
              <Switch
                checked={levelSystemSettings.reward_on_level_up}
                onCheckedChange={(checked) => 
                  setLevelSystemSettings(prev => ({...prev, reward_on_level_up: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Level Up Notifications</Label>
              <Switch
                checked={levelSystemSettings.level_up_notifications}
                onCheckedChange={(checked) => 
                  setLevelSystemSettings(prev => ({...prev, level_up_notifications: checked}))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Level Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {levelRewards.map((reward) => (
            <Card key={reward.level} className="border-2" style={{ borderColor: reward.color }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" style={{ color: reward.color }} />
                    Level {reward.level}
                  </CardTitle>
                  {levelRewards.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeLevel(reward.level)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Level Name</Label>
                  <Input
                    value={reward.name}
                    onChange={(e) => updateLevelReward(reward.level, 'name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={reward.description}
                    onChange={(e) => updateLevelReward(reward.level, 'description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Referrals Required</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        className="pl-10"
                        value={reward.referrals_required}
                        onChange={(e) => updateLevelReward(reward.level, 'referrals_required', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bonus Amount ({getCurrencyDisplay(currencySettings)})</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={reward.bonus_amount}
                        onChange={(e) => updateLevelReward(reward.level, 'bonus_amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Theme Color</Label>
                  <Input
                    type="color"
                    value={reward.color}
                    onChange={(e) => updateLevelReward(reward.level, 'color', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div>
                  <Label>Benefits</Label>
                  <div className="space-y-2">
                    {reward.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-1">
                          {benefit}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBenefit(reward.level, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new benefit..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addBenefit(reward.level, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addBenefit(reward.level, input.value);
                          input.value = '';
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Level */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex items-center justify-center py-12">
            <Button onClick={addNewLevel} variant="outline" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Level
            </Button>
          </CardContent>
        </Card>

        {/* Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Levels:</span>
                <span className="font-medium ml-2">{levelRewards.length}</span>
              </div>
              <div>
                <span className="text-gray-600">System Status:</span>
                <span className={`font-medium ml-2 ${levelSystemSettings.level_system_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {levelSystemSettings.level_system_enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Auto Calculation:</span>
                <span className={`font-medium ml-2 ${levelSystemSettings.auto_level_calculation ? 'text-green-600' : 'text-red-600'}`}>
                  {levelSystemSettings.auto_level_calculation ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Max Referrals:</span>
                <span className="font-medium ml-2">
                  {levelRewards.length > 0 ? Math.max(...levelRewards.map(r => r.referrals_required)) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUserLevelSettings;
