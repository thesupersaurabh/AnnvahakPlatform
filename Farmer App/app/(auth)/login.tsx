import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, Linking, ScrollView, Dimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { EyeIcon, EyeOffIcon, Lock, User } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDarkMode, colors } = useTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);
  
  const handleRegister = () => {
    router.replace('/register');
  };
  
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (!result.success) {
        let errorMessage = 'Invalid username or password';
        
        switch (result.error) {
          case 'invalid_credentials':
            errorMessage = result.message || 'Invalid username or password';
            break;
          case 'invalid_role':
            errorMessage = 'This app is for farmers only. Please use the appropriate AnnVahak app for your role.';
            break;
          case 'account_inactive':
            errorMessage = 'Your account has been deactivated. Please contact support.';
            break;
          case 'server_error':
            errorMessage = 'Unable to connect to server. Please try again later.';
            break;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Assistance',
      'If you forgot your password, please contact our support team for assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => Linking.openURL('mailto:support@annvahak.com?subject=Password%20Assistance') }
      ]
    );
  };
  
  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
        <LinearGradient
          colors={isDarkMode ? ['#1B5E20', '#2E7D32'] : ['#4CAF50', '#2E7D32']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to manage your farm products</Text>
          </View>
          
          <View style={styles.cardContainer}>
            <View style={[styles.cardContent, isDarkMode && styles.darkCardContent]}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Username</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper
                ]}>
                  <User size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your username"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper
                ]}>
                  <Lock size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.togglePasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} color={isDarkMode ? '#aaa' : colors.primary} />
                    ) : (
                      <EyeIcon size={20} color={isDarkMode ? '#aaa' : colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.forgotPasswordLink}
                onPress={handleForgotPassword}
                accessibilityLabel="Forgot password"
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleLogin} 
                disabled={loading || authLoading}
                style={loading || authLoading ? styles.disabledButton : null}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#2E7D32', '#1B5E20'] : ['#4CAF50', '#2E7D32']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {loading || authLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={[
                  styles.registerText, 
                  isDarkMode && styles.darkRegisterText
                ]}>
                  Don't have an account?{' '}
                  <Text
                    style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}
                    onPress={handleRegister}
                  >
                    Register
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
    padding: 5,
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  darkCardContent: {
    backgroundColor: '#222',
  },
  errorContainer: {
    backgroundColor: 'rgba(233, 30, 99, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.2)',
  },
  errorText: {
    color: '#e91e63',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#424242',
    marginBottom: 8,
    marginLeft: 4,
  },
  darkInputLabel: {
    color: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    height: 56,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  darkInputWrapper: {
    borderColor: '#444',
    backgroundColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#212121',
    paddingVertical: 10,
  },
  darkInput: {
    color: '#fff',
  },
  togglePasswordButton: {
    padding: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  loginButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#555',
    textAlign: 'center',
  },
  darkRegisterText: {
    color: '#aaa',
  },
});