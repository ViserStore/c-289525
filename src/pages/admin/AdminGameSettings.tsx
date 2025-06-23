import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Gamepad2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { gameService } from '@/services/gameService';
import { supabase } from '@/integrations/supabase/client';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings, getCurrencyDisplay } from '@/lib/utils';

const AdminGameSettings = () => {
  const [settings, setSettings] = useState({
    game_enabled: true,
    game_cost_per_play: 1.00,
    game_min_prize: 2.00,
    game_max_prize: 11.00,
    game_win_rate: 40,
    game_daily_play_limit: 50,
    game_min_balance_required: 1.00
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { settings: systemSettings } = useSystemSettings();

  useEffect(() => {
    loadGameSettings();
    loadGameStats();
  }, []);

  const loadGameSettings = async () => {
    try {
      console.log('Loading game settings...');
      const gameSettings = await gameService.getGameSettings();
      console.log('Game settings loaded:', gameSettings);
      setSettings(gameSettings);
    } catch (error) {
      console.error('Error loading game settings:', error);
      toast.error('Failed to load game settings');
      // Use default settings if loading fails
    } finally {
      setLoading(false);
    }
  };

  const loadGameStats = async () => {
    try {
      console.log('Loading game stats...');
      const gameStats = await gameService.getGameStatsForAdmin();
      console.log('Game stats loaded:', gameStats);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading game stats:', error);
      // Don't show error for stats, it's not critical
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      console.log('Saving game settings:', settings);
      
      // Update each setting in the database
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            setting_value: value.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key);

        if (error) {
          console.error(`Error updating ${key}:`, error);
          throw error;
        }
      }

      toast.success('Game settings updated successfully');
      await loadGameStats(); // Refresh stats
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save game settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Game Settings</h1>
              <p className="text-gray-600">Manage {getCurrencyDisplay(systemSettings)}1 game configuration and monitor performance</p>
            </div>
            <Button onClick={saveSettings} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Plays</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today_total_plays || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today_win_rate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Collected</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyWithSettings(stats.today_total_paid || 0, systemSettings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Gamepad2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Profit</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyWithSettings(stats.today_profit || 0, systemSettings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gamepad2 className="w-5 h-5 mr-2 text-emerald-600" />
                Basic Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="game_enabled">Enable Game</Label>
                  <p className="text-sm text-gray-500">Allow users to play the {getCurrencyDisplay(systemSettings)}1 game</p>
                </div>
                <Switch
                  id="game_enabled"
                  checked={settings.game_enabled}
                  onCheckedChange={(checked) => handleInputChange('game_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_play">Cost per Play ({getCurrencyDisplay(systemSettings)})</Label>
                <Input
                  id="cost_per_play"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.game_cost_per_play}
                  onChange={(e) => handleInputChange('game_cost_per_play', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_balance">Minimum Balance Required ({getCurrencyDisplay(systemSettings)})</Label>
                <Input
                  id="min_balance"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.game_min_balance_required}
                  onChange={(e) => handleInputChange('game_min_balance_required', parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prize Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
                Prize Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="min_prize">Minimum Prize ({getCurrencyDisplay(systemSettings)})</Label>
                <Input
                  id="min_prize"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.game_min_prize}
                  onChange={(e) => handleInputChange('game_min_prize', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_prize">Maximum Prize ({getCurrencyDisplay(systemSettings)})</Label>
                <Input
                  id="max_prize"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.game_max_prize}
                  onChange={(e) => handleInputChange('game_max_prize', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="win_rate">Win Rate (%)</Label>
                <Input
                  id="win_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.game_win_rate}
                  onChange={(e) => handleInputChange('game_win_rate', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">Percentage of games that result in wins</p>
              </div>
            </CardContent>
          </Card>

          {/* Limits Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                User Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="daily_limit">Daily Play Limit per User</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  min="1"
                  value={settings.game_daily_play_limit}
                  onChange={(e) => handleInputChange('game_daily_play_limit', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">Maximum number of games a user can play per day</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Gamepad2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-orange-900">Important Notes</h3>
                <ul className="mt-2 text-sm text-orange-800 space-y-1">
                  <li>• Changes take effect immediately for new games</li>
                  <li>• Win rate affects the probability of users winning prizes</li>
                  <li>• Daily limits reset at midnight</li>
                  <li>• Minimum balance prevents users from playing without sufficient funds</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminGameSettings;
