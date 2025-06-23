
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Theme {
  name: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
  };
}

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  switchTheme: (themeName: string) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

const defaultTheme: Theme = {
  name: 'default',
  display_name: 'Default',
  is_active: true,
  is_default: true,
  colors: {
    primary: '#10b981',
    secondary: '#6b7280',
    accent: '#f59e0b',
    background: '#ffffff',
    card: '#f9fafb',
    text: '#111827'
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [themes] = useState<Theme[]>([defaultTheme]);
  const [loading] = useState(false);

  const switchTheme = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName);
    if (theme) {
      setCurrentTheme(theme);
      // Apply theme colors to CSS variables
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  };

  useEffect(() => {
    // Apply default theme on mount
    switchTheme('default');
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, themes, switchTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}
