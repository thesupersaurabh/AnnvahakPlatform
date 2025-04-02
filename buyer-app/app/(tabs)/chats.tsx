import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { RefreshCw } from 'lucide-react-native';

interface Conversation {
  user: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  latest_message: {
    message: string;
    sender_id: number;
    created_at: string;
  };
  unread_count: number;
}

export default function Chats() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchConversations();
    }
  }, [isAuthenticated, token]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/conversations`, {        
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        console.error('Error fetching conversations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [token]);

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>Chats</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, isDarkMode && styles.darkText]}>Please login to view your chats</Text>
          <TouchableOpacity 
            style={styles.loginButton}
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
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>Chats</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#1a1a1a"} />
        </View>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.headerWithRefresh, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>Chats</Text>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#666"} />
            ) : (
              <RefreshCw size={20} color={isDarkMode ? "#fff" : "#666"} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, isDarkMode && styles.darkText]}>No conversations yet</Text>
          <Text style={[styles.subText, isDarkMode && { color: '#aaa' }]}>
            Start chatting with farmers by viewing their products
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Not today, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={isDarkMode ? "#fff" : "#1a1a1a"}
          colors={[isDarkMode ? "#fff" : "#1a1a1a"]}
        />
      }
    >
      <View style={[styles.headerWithRefresh, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Messages</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#666"} />
          ) : (
            <RefreshCw size={20} color={isDarkMode ? "#fff" : "#666"} />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.chatList}>
        {conversations.map((conversation) => (
          <TouchableOpacity 
            key={conversation.user.id} 
            onPress={() => router.push(`/chat/${conversation.user.id}`)}
            style={[styles.chatCard, isDarkMode && styles.darkChatCard]}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {conversation.user.full_name.charAt(0)}
              </Text>
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.userName, isDarkMode && styles.darkText]}>{conversation.user.full_name}</Text>
                <Text style={[styles.timestamp, isDarkMode && { color: '#aaa' }]}>
                  {formatDate(conversation.latest_message.created_at)}
                </Text>
              </View>
              
              <View style={styles.messagePreview}>
                <Text style={[styles.lastMessage, isDarkMode && { color: '#aaa' }]} numberOfLines={1}>
                  {conversation.latest_message.message}
                </Text>
                {conversation.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {conversation.unread_count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#fff',
  },
  headerWithRefresh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatList: {
    padding: 15,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkChatCard: {
    backgroundColor: '#1e1e1e',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
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
  browseButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});