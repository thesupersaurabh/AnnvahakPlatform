import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, Image, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { MessageSquare, Search, BadgeCheck, HelpCircle } from 'lucide-react-native';

// Admin user ID constant
const ADMIN_USER_ID = 1;

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

export default function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const { colors, isDarkMode } = useTheme();
  const { token, isAuthenticated, user } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const fetchConversations = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // In a real implementation, fetch from your API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/conversations`, {        
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Ensure admin is at the top if exists in the conversations
        const sortedConversations = [...(data.conversations || [])].sort((a, b) => {
          if (a.user.id === ADMIN_USER_ID) return -1;
          if (b.user.id === ADMIN_USER_ID) return 1;
          
          // Sort by latest message time for non-admin conversations
          return new Date(b.latest_message.created_at).getTime() - 
                 new Date(a.latest_message.created_at).getTime();
        });
        
        setConversations(sortedConversations);
        setFilteredConversations(sortedConversations);
      } else {
        console.error('Error fetching conversations:', await response.text());
        
        // For demo purposes, use mock data if API fails
        setMockData();
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // For demo purposes, use mock data
      setMockData();
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  const setMockData = () => {
    // Mock conversations with admin chat first
    const mockConversations: Conversation[] = [
      {
        user: {
          id: 1, // Admin ID
          username: 'admin',
          full_name: 'Admin Support',
          role: 'admin'
        },
        latest_message: {
          message: 'How can I help you with your farming business today?',
          sender_id: 1,
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
        },
        unread_count: 2
      },
      {
        user: {
          id: 101,
          username: 'rahulsharma',
          full_name: 'Rahul Sharma',
          role: 'buyer'
        },
        latest_message: {
          message: 'I would like to place a bulk order for your organic tomatoes.',
          sender_id: 101,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        unread_count: 1
      },
      {
        user: {
          id: 102,
          username: 'priyapatel',
          full_name: 'Priya Patel',
          role: 'buyer'
        },
        latest_message: {
          message: 'Thank you for the quick delivery! The vegetables were fresh.',
          sender_id: 102,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        unread_count: 0
      },
      {
        user: {
          id: 103,
          username: 'amitkumar',
          full_name: 'Amit Kumar',
          role: 'buyer'
        },
        latest_message: {
          message: 'Do you offer any discounts for bulk orders?',
          sender_id: 103,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        unread_count: 1
      },
      {
        user: {
          id: 104,
          username: 'sunitaverma',
          full_name: 'Sunita Verma',
          role: 'buyer'
        },
        latest_message: {
          message: 'When will you have fresh apples in stock again?',
          sender_id: 104,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        unread_count: 0
      }
    ];
    
    setConversations(mockConversations);
    setFilteredConversations(mockConversations);
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, fetchConversations]);

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim() === '') {
      // Filter out self-conversations (where the user is talking to themselves)
      const filteredList = conversations.filter(conversation => 
        conversation.user.id !== user?.id // Filter out conversations with yourself
      );
      setFilteredConversations(filteredList);
    } else {
      const filtered = conversations.filter(conversation => 
        (conversation.user.id !== user?.id) && // Filter out conversations with yourself
        (conversation.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.latest_message.message.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week, show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // More than a week ago, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const handleContactAdmin = async () => {
    try {
      // Check if we need to send an initial message to create the conversation
      const hasAdminChat = conversations.some(conv => conv.user.id === ADMIN_USER_ID);
      
      if (!hasAdminChat) {
        // In a real implementation, send an initial message to admin
        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver_id: ADMIN_USER_ID,
            message: "Hello admin, I need assistance with my farmer account.",
          }),
        });
      }
      
      // Navigate to admin chat
      router.push(`/chat/${ADMIN_USER_ID}`);
    } catch (error) {
      console.error('Error contacting admin:', error);
      // Even if sending the message fails, still navigate to the chat
      router.push(`/chat/${ADMIN_USER_ID}`);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>Please login to view your messages</Text>
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  // Check if we have an admin chat in our list
  const hasAdminChat = conversations.some(conv => conv.user.id === ADMIN_USER_ID);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={isDarkMode ? "#fff" : "#1a1a1a"}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Search size={18} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search messages..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {/* Contact admin button (only show if admin chat doesn't exist) */}
      {!hasAdminChat && (
        <TouchableOpacity 
          style={[styles.contactAdminCard, isDarkMode && styles.darkContactAdminCard]}
          onPress={handleContactAdmin}
        >
          <View style={styles.contactAdminContent}>
            <HelpCircle size={24} color={isDarkMode ? "#fff" : "#1a1a1a"} />
            <Text style={[styles.contactAdminText, isDarkMode && { color: '#fff' }]}>
              Need help? Contact admin
            </Text>
          </View>
          <Text style={[styles.contactAdminSubtext, isDarkMode && { color: '#aaa' }]}>
            Get support for selling products, order issues, or account questions
          </Text>
        </TouchableOpacity>
      )}
      
      {conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>No conversations yet</Text>
          <Text style={[styles.subText, { color: colors.secondary }]}>
            Customers will contact you when they're interested in your products
          </Text>
        </View>
      ) : (
        <View style={styles.chatList}>
          {filteredConversations.map((conversation) => {
            const isAdmin = conversation.user.id === ADMIN_USER_ID;
            const isUnread = conversation.unread_count > 0;
            
            return (
              <TouchableOpacity 
                key={conversation.user.id} 
                onPress={() => router.push(`/chat/${conversation.user.id}`)}
                style={[
                  styles.chatCard, 
                  { backgroundColor: colors.card },
                  isDarkMode && styles.darkChatCard,
                  isAdmin && styles.adminChatCard,
                  isUnread && styles.unreadChatCard
                ]}
              >
                <View style={[
                  styles.avatarContainer,
                  isAdmin && styles.adminAvatarContainer
                ]}>
                  <Text style={styles.avatarText}>
                    {conversation.user.full_name.charAt(0)}
                  </Text>
                </View>
                
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <View style={styles.nameContainer}>
                      <Text 
                        style={[
                          styles.userName, 
                          { color: colors.text }, 
                          isDarkMode && styles.darkText,
                          isUnread && styles.unreadText
                        ]}
                      >
                        {conversation.user.full_name}
                      </Text>
                      
                      {isAdmin && (
                        <View style={styles.badgeContainer}>
                          <BadgeCheck size={16} color="#4CAF50" />
                          <Text style={styles.adminBadge}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text 
                      style={[
                        styles.timestamp, 
                        { color: colors.secondary },
                        isDarkMode && { color: '#aaa' },
                        isUnread && styles.unreadTimestamp
                      ]}
                    >
                      {formatDate(conversation.latest_message.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.messagePreview}>
                    <Text 
                      style={[
                        styles.lastMessage, 
                        { color: colors.secondary },
                        isDarkMode && { color: '#aaa' },
                        isUnread && styles.unreadMessage
                      ]} 
                      numberOfLines={1}
                    >
                      {conversation.user.id === conversation.latest_message.sender_id ? '' : 'You: '}
                      {conversation.latest_message.message}
                    </Text>
                    
                    {isUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {conversation.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
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
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  chatList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkChatCard: {
    backgroundColor: '#1e1e1e',
  },
  adminChatCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  unreadChatCard: {
    backgroundColor: '#f0f7ff',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatarContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
    marginRight: 6,
  },
  darkText: {
    color: '#fff',
  },
  unreadText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  adminBadge: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
    marginLeft: 2,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  unreadTimestamp: {
    fontFamily: 'Inter_600SemiBold',
    color: '#007AFF',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  contactAdminCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkContactAdminCard: {
    backgroundColor: '#1e1e1e',
  },
  contactAdminContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactAdminText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
    marginLeft: 12,
  },
  contactAdminSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginLeft: 36,
  },
}); 