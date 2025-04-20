import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, RefreshControl, Switch } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { router, useFocusEffect } from 'expo-router';
import { Heart, CircleHelp as HelpCircle, LogOut, Store, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { api, endpoints } from '../../utils/api';
import { Platform } from 'react-native';

interface Farmer {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  profile_image?: string;
  created_at: string;
  role: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, logout, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFarmerProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token) {
        fetchFarmerProfile();
      }
    }, [isAuthenticated, token])
  );

  const fetchFarmerProfile = async () => {
    try {
      const response = await api.get<{ user: Farmer }>(
        endpoints.auth.profile,
        token || undefined
      );
      
      if (response.success) {
        setProfile(response.data.user);
      } else {
        console.error('Error fetching profile:', response.message);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFarmerProfile();
    setRefreshing(false);
  }, [token]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
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
            {profile.role === 'farmer' ? 'Farmer' : profile.role}
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
          onPress={() => router.push('/(tabs)/home')}
        >
          <Store size={24} color={colors.primary} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: colors.text }]}>My Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => router.push('/chat/1')}
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
    padding: 30,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A6572',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontFamily: 'Inter_600SemiBold',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
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
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 0,
  },
  optionIcon: {
    marginRight: 16,
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
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});