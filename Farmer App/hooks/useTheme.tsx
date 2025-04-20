import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types and colors
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Colors for light and dark mode
const lightColors: ThemeColors = {
  primary: '#4caf50',
  secondary: '#757575',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#212121',
  border: '#e0e0e0',
  notification: '#f44336',
  error: '#f44336',
  success: '#4caf50',
  warning: '#ff9800',
};

const darkColors: ThemeColors = {
  primary: '#66bb6a',
  secondary: '#9e9e9e',
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  border: '#333333',
  notification: '#f44336',
  error: '#e57373',
  success: '#81c784',
  warning: '#ffb74d',
};

// Create the context
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'system',
  colors: lightColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

// Storage key
const THEME_MODE_KEY = '@theme_mode';

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  
  // Calculate if dark mode should be active based on theme mode and system setting
  const isDarkMode = 
    themeMode === 'system' 
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';
  
  // Current colors based on dark mode state
  const colors = isDarkMode ? darkColors : lightColors;

  // Load saved theme mode
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedMode) {
          setThemeMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode', error);
      }
    };
    
    loadThemeMode();
  }, []);

  // Toggle between light and dark
  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
    saveModeToStorage(newMode);
  };

  // Set specific mode
  const setThemeModeAndSave = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveModeToStorage(mode);
  };

  // Save to storage
  const saveModeToStorage = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{
        isDarkMode,
        themeMode,
        colors,
        toggleTheme,
        setThemeMode: setThemeModeAndSave,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme
export const useTheme = () => useContext(ThemeContext); 