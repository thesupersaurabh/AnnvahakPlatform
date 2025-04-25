import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Bell, Moon, Lock, Globe, HelpCircle } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

export default function Settings() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  
  if (!fontsLoaded) {
    return null;
  }
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, you would send this preference to the backend
  };
  
  const toggleLocation = () => {
    setLocationEnabled(!locationEnabled);
    // In a real app, you would send this preference to the backend
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
        
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingsRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Bell size={20} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingsRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Moon size={20} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingsRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Share Location</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={toggleLocation}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/profile/account')}
          >
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/chat/support')}
          >
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <HelpCircle size={20} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.secondary }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginVertical: 16,
  },
  settingsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 100, 240, 0.1)',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsButton: {
    padding: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
}); 