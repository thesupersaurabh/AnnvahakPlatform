import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    inactive: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const deviceTheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    // Load theme preference from storage
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) {
          setThemeState(storedTheme as ThemeType);
        } else if (deviceTheme) {
          // Use device theme as default if not set manually
          setThemeState(deviceTheme as ThemeType);
        }
      } catch (error) {
        console.error('Error loading theme', error);
      }
    };

    loadTheme();
  }, [deviceTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme', error);
    }
  };

  // Define colors based on theme
  const lightColors = {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#1a1a1a',
    primary: '#1a1a1a',
    secondary: '#666666',
    border: '#e0e0e0',
    inactive: '#d1d1d1',
  };
  
  const darkColors = {
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    primary: '#ffffff',
    secondary: '#a0a0a0',
    border: '#2c2c2c',
    inactive: '#3d3d3d',
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setTheme,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 