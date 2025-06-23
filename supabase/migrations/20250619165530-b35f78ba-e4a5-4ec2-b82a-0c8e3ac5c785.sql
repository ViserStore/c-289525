
-- Create themes table to store different color themes
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  colors JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default themes
INSERT INTO public.themes (name, display_name, colors, is_active, is_default) VALUES
('emerald', 'Emerald Green', '{"primary": "#10b981", "secondary": "#059669", "accent": "#34d399", "background": "#f0fdf4", "card": "#ffffff", "text": "#1f2937"}', true, true),
('blue', 'Ocean Blue', '{"primary": "#3b82f6", "secondary": "#1d4ed8", "accent": "#60a5fa", "background": "#eff6ff", "card": "#ffffff", "text": "#1f2937"}', false, false),
('purple', 'Royal Purple', '{"primary": "#8b5cf6", "secondary": "#7c3aed", "accent": "#a78bfa", "background": "#faf5ff", "card": "#ffffff", "text": "#1f2937"}', false, false),
('rose', 'Rose Pink', '{"primary": "#f43f5e", "secondary": "#e11d48", "accent": "#fb7185", "background": "#fff1f2", "card": "#ffffff", "text": "#1f2937"}', false, false),
('orange', 'Sunset Orange', '{"primary": "#f97316", "secondary": "#ea580c", "accent": "#fb923c", "background": "#fff7ed", "card": "#ffffff", "text": "#1f2937"}', false, false),
('teal', 'Tropical Teal', '{"primary": "#14b8a6", "secondary": "#0d9488", "accent": "#5eead4", "background": "#f0fdfa", "card": "#ffffff", "text": "#1f2937"}', false, false),
('indigo', 'Deep Indigo', '{"primary": "#6366f1", "secondary": "#4f46e5", "accent": "#818cf8", "background": "#eef2ff", "card": "#ffffff", "text": "#1f2937"}', false, false),
('cyan', 'Sky Cyan', '{"primary": "#06b6d4", "secondary": "#0891b2", "accent": "#67e8f9", "background": "#ecfeff", "card": "#ffffff", "text": "#1f2937"}', false, false),
('lime', 'Fresh Lime', '{"primary": "#84cc16", "secondary": "#65a30d", "accent": "#a3e635", "background": "#f7fee7", "card": "#ffffff", "text": "#1f2937"}', false, false),
('amber', 'Golden Amber', '{"primary": "#f59e0b", "secondary": "#d97706", "accent": "#fbbf24", "background": "#fffbeb", "card": "#ffffff", "text": "#1f2937"}', false, false),
('red', 'Crimson Red', '{"primary": "#ef4444", "secondary": "#dc2626", "accent": "#f87171", "background": "#fef2f2", "card": "#ffffff", "text": "#1f2937"}', false, false),
('slate', 'Modern Slate', '{"primary": "#64748b", "secondary": "#475569", "accent": "#94a3b8", "background": "#f8fafc", "card": "#ffffff", "text": "#1f2937"}', false, false);

-- Add theme setting to system_settings if not exists
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description)
VALUES ('active_theme', 'emerald', 'string', 'appearance', 'Currently active theme for the application')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to activate a theme
CREATE OR REPLACE FUNCTION public.activate_theme(theme_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  theme_exists BOOLEAN;
BEGIN
  -- Check if theme exists
  SELECT EXISTS(SELECT 1 FROM public.themes WHERE name = theme_name) INTO theme_exists;
  
  IF NOT theme_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Deactivate all themes
  UPDATE public.themes SET is_active = false;
  
  -- Activate selected theme
  UPDATE public.themes SET is_active = true WHERE name = theme_name;
  
  -- Update system setting
  UPDATE public.system_settings 
  SET setting_value = theme_name, updated_at = now()
  WHERE setting_key = 'active_theme';
  
  RETURN TRUE;
END;
$$;

-- Enable RLS on themes table
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading themes (public can read)
CREATE POLICY "Anyone can view themes" ON public.themes FOR SELECT USING (true);

-- Create policy for admin operations (you may want to restrict this based on your auth system)
CREATE POLICY "Admins can manage themes" ON public.themes FOR ALL USING (true);
