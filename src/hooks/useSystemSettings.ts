
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyInfo {
  symbol: string;
  name: string;
}

interface SystemSettings {
  siteName: string;
  currencyCode: string;
  currencySymbol: string;
  supportedCurrencies: Record<string, CurrencyInfo>;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'EasyPaisa',
    currencyCode: 'PKR',
    currencySymbol: 'Rs.',
    supportedCurrencies: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['site_name', 'default_currency_code', 'default_currency_symbol', 'supported_currencies']);

      if (error) {
        console.error('Error fetching system settings:', error);
        return;
      }

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value || '';
      });

      // Parse supported currencies with fallback
      let supportedCurrencies = {};
      try {
        if (settingsMap.supported_currencies) {
          supportedCurrencies = JSON.parse(settingsMap.supported_currencies);
        }
      } catch (e) {
        console.warn('Failed to parse supported currencies:', e);
      }

      setSettings({
        siteName: settingsMap.site_name || 'EasyPaisa',
        currencyCode: settingsMap.default_currency_code || 'PKR',
        currencySymbol: settingsMap.default_currency_symbol || 'Rs.',
        supportedCurrencies
      });
    } catch (error) {
      console.error('Error parsing system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
};
