import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, TextInput, Alert, Switch, RefreshControl } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Settings, Heart, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, logout, isAuthenticated } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>Please login to view your profile</Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (showSettings) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.headerWithButton, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingsForm, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 20, marginTop: 20 }]}>
          <View style={styles.preferencesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>App Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={(value) => {
                  toggleTheme();
                  // Give feedback that the setting is saved
                  setTimeout(() => {
                    Alert.alert('Dark Mode', value ? 'Dark mode enabled' : 'Dark mode disabled');
                  }, 300);
                }}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
              />
            </View>
          </View>
          
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}
              onPress={handleLogout}
            >
              <LogOut size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
              <Text style={{ color: "#FF6B6B", fontFamily: 'Inter_600SemiBold' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ marginHorizontal: 20, marginTop: 30 }}>
          <Text style={{ 
            color: colors.secondary, 
            fontFamily: 'Inter_400Regular', 
            fontSize: 12, 
            textAlign: 'center' 
          }}>
            Annvahak App v1.0.0
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>
      
      {profile && (
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>{profile.full_name}</Text>
          <Text style={[styles.userEmail, { color: colors.secondary }]}>{profile.email}</Text>
          <Text style={[styles.userRole, { color: colors.primary }]}>
            {profile.role === 'buyer' ? 'Consumer' : profile.role}
          </Text>
          
          <View style={styles.infoContainer}>
            {!profile.address && !profile.phone && (
              <View style={[styles.noInfoContainer, { borderColor: isDarkMode ? '#444' : '#ccc' }]}>
                <Text style={{ color: colors.secondary, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                  Hello, {profile.full_name.split(' ')[0]}!
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <View style={[styles.optionsList, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => setShowSettings(true)}
        >
          <Settings size={24} color={colors.primary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => router.push('/(tabs)/wishlist')}
        >
          <Heart size={24} color={colors.primary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text }]}>My Wishlist</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => Alert.alert(
            'Help & Support', 
            'For assistance, please email us at support@annvahak.com or call our helpline at +91-1234567890.',
            [
              {text: 'OK', style: 'default'}
            ]
          )}
        >
          <HelpCircle size={24} color={colors.primary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text }]}>Help & Support</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.logoutCard, { backgroundColor: colors.card }]}
        onPress={handleLogout}
      >
        <LogOut size={24} color="#FF6B6B" style={styles.optionIcon} />
        <Text style={[styles.optionText, { color: "#FF6B6B" }]}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: colors.secondary }]}>
          Annvahak App v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  refreshButton: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontFamily: 'Inter_600SemiBold',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 100, 240, 0.1)',
    overflow: 'hidden',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 16,
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 10,
  },
  infoLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  optionsList: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  settingsForm: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 20,
    marginBottom: 16,
  },
  settingsDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  preferencesSection: {
    marginBottom: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  preferenceLabel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  noInfoContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  logoutSection: {
    marginTop: 20,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  versionContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});