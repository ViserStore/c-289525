
import { supabase } from '@/integrations/supabase/client';

interface ImageKitSettings {
  imagekit_id: string;
  imagekit_public_key: string;
  imagekit_private_key: string;
  imagekit_url_endpoint: string;
}

export class ImageKitService {
  private static settings: ImageKitSettings | null = null;

  static async getSettings(): Promise<ImageKitSettings> {
    if (this.settings) return this.settings;

    const { data } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['imagekit_id', 'imagekit_public_key', 'imagekit_private_key', 'imagekit_url_endpoint']);

    const settings: any = {};
    data?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    this.settings = settings as ImageKitSettings;
    return this.settings;
  }

  static async uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
    const settings = await this.getSettings();
    
    if (!settings.imagekit_id || !settings.imagekit_public_key || !settings.imagekit_private_key) {
      throw new Error('ImageKit settings not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('folder', folder);

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(settings.imagekit_private_key + ':')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.url;
  }

  static getImageUrl(path: string): string {
    if (!this.settings?.imagekit_id) return path;
    return `https://ik.imagekit.io/${this.settings.imagekit_id}/${path}`;
  }
}
