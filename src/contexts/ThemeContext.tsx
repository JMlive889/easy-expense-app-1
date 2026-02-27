import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_preference') as Theme | null;
    const landingDarkMode = localStorage.getItem('darkMode');
    const effectiveTheme: Theme = savedTheme
      ? savedTheme
      : landingDarkMode !== null
        ? (JSON.parse(landingDarkMode) ? 'dark' : 'light')
        : 'dark';
    setTheme(effectiveTheme);
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && profile?.theme_preference) {
      setTheme(profile.theme_preference);
      applyTheme(profile.theme_preference);
    }
  }, [profile, isInitialized]);

  const applyTheme = (newTheme: Theme) => {
    localStorage.setItem('theme_preference', newTheme);
    localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    if (!user) return;

    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', user.id);

      if (error) throw error;

      setTheme(newTheme);
      applyTheme(newTheme);
      await refreshProfile();
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
