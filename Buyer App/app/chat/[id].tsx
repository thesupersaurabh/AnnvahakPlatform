import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
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

export default function Chat() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchChat();
    }
  }, [id, isAuthenticated, token]);

  const fetchChat = async () => {
    try {
      console.log(`Fetching chat for user ID: ${id}`);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Chat fetch response status:', response.status);
      const data = await response.json();
      console.log('Chat fetch data:', JSON.stringify(data).substring(0, 100) + '...');
      
      if (response.ok) {
        setMessages(data.messages || []);
        setOtherUser(data.other_user);
      } else {
        Alert.alert('Error', data.message || 'Failed to load chat');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          message: newMessage.trim(),
        }),
      });

      console.log('Message send response status:', response.status);
      const data = await response.json();
      console.log('Message send response:', JSON.stringify(data).substring(0, 100) + '...');

      if (response.ok) {
        setMessages(prevMessages => [...prevMessages, data.chat]);
        setNewMessage('');
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return null;
  }
  
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#1a1a1a"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Chat</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, isDarkMode && styles.darkText]}>Please login to view chats</Text>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#1a1a1a"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Chat</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#1a1a1a"} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#1a1a1a"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>{otherUser?.full_name || 'Chat'}</Text>
        
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#1a1a1a"} />
          ) : (
            <ArrowLeft size={16} color={isDarkMode ? "#fff" : "#1a1a1a"} style={{ transform: [{ rotate: '45deg' }] }} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.messageList}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, isDarkMode && styles.darkText]}>No messages yet</Text>
            <Text style={[styles.emptyChatSubtext, isDarkMode && { color: '#aaa' }]}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View 
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender_id === parseInt(id as string) 
                  ? styles.receivedMessage 
                  : styles.sentMessage,
                isDarkMode && message.sender_id === parseInt(id as string) 
                  ? styles.darkReceivedMessage 
                  : {}
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender_id === parseInt(id as string) 
                  ? (isDarkMode ? styles.darkReceivedText : styles.receivedText) 
                  : styles.sentText
              ]}>
                {message.message}
              </Text>
              <Text style={[
                styles.messageTime,
                message.sender_id === parseInt(id as string) 
                  ? (isDarkMode ? styles.darkReceivedTime : styles.receivedTime) 
                  : styles.sentTime
              ]}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
        <TextInput
          style={[styles.input, isDarkMode && styles.darkInput]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={isDarkMode ? '#999' : '#666'}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' ? { maxWidth: 800, marginHorizontal: 'auto' } : {})
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  darkText: {
    color: '#fff',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderColor: '#444',
  },
  darkInputContainer: {
    backgroundColor: '#1e1e1e',
    borderTopColor: '#333',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
    flex: 1,
  },
  messageList: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a1a',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? { borderWidth: 1, borderColor: '#e0e0e0' } : {}),
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  sentTime: {
    color: '#fff',
    opacity: 0.7,
  },
  receivedTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyChatText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptyChatSubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  darkReceivedMessage: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  darkReceivedText: {
    color: '#fff',
  },
  darkReceivedTime: {
    color: '#aaa',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});