import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Send, BadgeCheck, Check, CheckCheck } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

interface OtherUser {
  id: number;
  role: string;
  full_name: string;
}

// Admin user ID constant
const ADMIN_USER_ID = 1;

export default function Chat() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { token, isAuthenticated, user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    // Check if user is trying to chat with themselves and redirect if so
    if (user && id && user.id === (typeof id === 'string' ? parseInt(id) : id)) {
      Alert.alert('Invalid Action', 'You cannot chat with yourself');
      router.replace('/(tabs)/messages');
      return;
    }
    
    if (isAuthenticated && token) {
      fetchChat();
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated, token, user]);

  const fetchChat = async () => {
    if (!token || !id) return;
    
    try {
      console.log(`Fetching chat for user ID: ${id}`);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Chat fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat fetch data:', JSON.stringify(data).substring(0, 100) + '...');
        
        setMessages(data.messages || []);
        setOtherUser(data.other_user);
        
        // Mark messages as read
        if (data.messages?.length > 0 && data.messages.some(m => !m.is_read && m.sender_id.toString() === id.toString())) {
          markMessagesAsRead();
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to load chat');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      // For demo purposes, use mock data
      setMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const setMockData = () => {
    const isAdminChat = id === ADMIN_USER_ID || id === '1';
    
    const mockUser: OtherUser = isAdminChat 
      ? { id: 1, role: 'admin', full_name: 'Admin Support' }
      : { id: parseInt(id as string), role: 'buyer', full_name: 'Rahul Sharma' };
    
    setOtherUser(mockUser);
    
    const currentTime = new Date();
    const yesterday = new Date(currentTime);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockMessages: Message[] = isAdminChat ? [
      {
        id: 1,
        sender_id: 1,
        receiver_id: user?.id || 100,
        message: "Hello! Welcome to AnnVahak Seller. How can I help you today?",
        is_read: true,
        created_at: yesterday.toISOString()
      },
      {
        id: 2,
        sender_id: user?.id || 100,
        receiver_id: 1,
        message: "Hi Admin! I'm having trouble updating my product listings. Can you help?",
        is_read: true,
        created_at: yesterday.toISOString()
      },
      {
        id: 3,
        sender_id: 1,
        receiver_id: user?.id || 100,
        message: "Of course! What specific issue are you facing with your product listings?",
        is_read: true,
        created_at: yesterday.toISOString()
      },
      {
        id: 4,
        sender_id: 1,
        receiver_id: user?.id || 100,
        message: "Can you tell me which products you're trying to update and what happens when you try to save changes?",
        is_read: false,
        created_at: new Date(currentTime.getTime() - 60 * 60 * 1000).toISOString() // 1 hour ago
      }
    ] : [
      {
        id: 1,
        sender_id: parseInt(id as string),
        receiver_id: user?.id || 100,
        message: "Hello! I'm interested in buying your organic tomatoes. Are they still available?",
        is_read: true,
        created_at: yesterday.toISOString()
      },
      {
        id: 2,
        sender_id: user?.id || 100,
        receiver_id: parseInt(id as string),
        message: "Yes, I have 20kg of organic tomatoes available right now. When would you like to receive them?",
        is_read: true,
        created_at: yesterday.toISOString()
      },
      {
        id: 3,
        sender_id: parseInt(id as string),
        receiver_id: user?.id || 100,
        message: "That's great! I would like to purchase 10kg. Can you deliver them by this weekend?",
        is_read: true,
        created_at: new Date(currentTime.getTime() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      }
    ];
    
    setMessages(mockMessages);
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      // Update local state to mark messages as read
      setMessages(prevMessages =>
        prevMessages.map(msg => 
          msg.sender_id.toString() === id?.toString() ? {...msg, is_read: true} : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChat();
  }, [id, token]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!token) {
      Alert.alert('Authentication Required', 'You need to login to send messages');
      return;
    }

    setSending(true);
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      sender_id: user?.id || 0,
      receiver_id: parseInt(id as string),
      message: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    
    // Add optimistic update
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setNewMessage('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      console.log(`Sending message to user ID: ${id}`);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: id,
          message: tempMessage.message,
        }),
      });

      console.log('Message send response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Message send response:', JSON.stringify(data).substring(0, 100) + '...');
        
        // Replace temp message with actual message from server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId ? data.chat : msg
          )
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to send message');
        
        // Remove failed temp message
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== tempId)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      
      // Remove failed temp message
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempId)
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // Calculate difference in days
    const isToday = messageDate.getDate() === now.getDate() && 
                   messageDate.getMonth() === now.getMonth() && 
                   messageDate.getFullYear() === now.getFullYear();
                   
    const isYesterday = messageDate.getDate() === now.getDate() - 1 && 
                        messageDate.getMonth() === now.getMonth() && 
                        messageDate.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return 'Today';
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].created_at);
    const prevDate = new Date(messages[index - 1].created_at);
    
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  if (!fontsLoaded) {
    return null;
  }
  
  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
            title: "Chat"
          }} 
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.centerContainer}>
            <Text style={[styles.messageText, { color: colors.text }]}>Please login to view chats</Text>
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }
  
  if (loading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
            title: "Chat"
          }} 
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading conversation...</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          title: otherUser?.full_name || "Chat"
        }} 
      />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerNameContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {otherUser?.full_name || 'Chat'}
              </Text>
              
              {otherUser?.id === ADMIN_USER_ID && (
                <View style={styles.adminBadgeContainer}>
                  <BadgeCheck size={16} color="#4CAF50" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userRole, { color: colors.secondary }]}>
              {otherUser?.role === 'admin' ? 'Support Team' : 'Buyer'}
            </Text>
          </View>
          
          <View style={{width: 40}} />
        </View>

        <ScrollView 
          style={styles.messageList}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Send size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyChatText, { color: colors.text }]}>No messages yet</Text>
              <Text style={[styles.emptyChatSubtext, { color: colors.secondary }]}>
                Start a conversation with {otherUser?.full_name || 'this user'}!
              </Text>
              <View style={styles.emptyChatArrow}>
                <Send size={24} color={colors.primary} style={{transform: [{rotate: '320deg'}]}} />
              </View>
            </View>
          ) : (
            <View style={styles.messageContainer}>
              {messages.map((message, index) => {
                const isUserMessage = message.sender_id === user?.id;
                const showDate = shouldShowDate(index);
                const isLastMessage = index === messages.length - 1;
                
                return (
                  <View key={`${message.id}-${index}`} style={styles.messageWrapper}>
                    {showDate && (
                      <View style={styles.dateContainer}>
                        <Text style={[styles.dateText, { color: colors.secondary }]}>
                          {formatDate(message.created_at)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      isUserMessage ? [styles.userMessage, { backgroundColor: colors.primary }] : [styles.otherMessage, { backgroundColor: colors.card }],
                      isLastMessage && isUserMessage && { marginBottom: 16 }
                    ]}>
                      <Text style={[
                        styles.messageText,
                        isUserMessage ? styles.userMessageText : [styles.otherMessageText, { color: colors.text }]
                      ]}>
                        {message.message}
                      </Text>
                      <View style={styles.messageFooter}>
                        <Text style={[
                          styles.messageTime,
                          isUserMessage ? styles.userMessageTime : { color: colors.secondary }
                        ]}>
                          {formatTime(message.created_at)}
                        </Text>
                        
                        {isUserMessage && (
                          <View style={styles.messageStatus}>
                            {typeof message.id === 'number' ? (
                              message.is_read ? (
                                <CheckCheck size={14} color="rgba(255, 255, 255, 0.7)" />
                              ) : (
                                <Check size={14} color="rgba(255, 255, 255, 0.7)" />
                              )
                            ) : (
                              <View style={styles.sendingIndicator} />
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.secondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: colors.primary },
              !newMessage.trim() && styles.disabledSendButton
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#777',
  },
  adminBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#4CAF50',
    marginLeft: 2,
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
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
    color: '#777',
  },
  loginButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flex: 1,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 4,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#777',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007BFF',
    borderTopRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageStatus: {
    marginLeft: 4,
  },
  sendingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopColor: 'rgba(0,0,0,0.05)',
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#f0f0f0',
  },
  sendButton: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyChatIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptyChatSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: '#777',
    marginBottom: 24,
  },
  emptyChatArrow: {
    position: 'absolute',
    bottom: -10,
    right: 30,
  },
});