import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { EyeIcon, EyeOffIcon, User, Mail, Phone, MapPin, Lock } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Register() {
  const { register, isLoading: authLoading, isAuthenticated } = useAuth();
  const { isDarkMode, colors } = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  
  const handleLogin = () => {
    router.replace('/login');
  };
  
  const validateForm = () => {
    // Reset errors
    setErrors({});
    let valid = true;
    let newErrors: Record<string, string> = {};

    // Username checks
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    // Email checks
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    // Password checks
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
      });
      
      if (success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created! You will be redirected to the home screen.',
          [{ 
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }]
        );
        // The auth hook will handle authentication state
      } else {
        Alert.alert(
          'Registration Failed',
          'There was a problem creating your account. The username or email may already be taken.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    if (field === 'confirmPassword') {
      setFormData(prev => ({ ...prev, confirmPassword: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our farming community today!</Text>
          </View>
          
          <View style={styles.cardContainer}>
            <View style={[styles.cardContent, isDarkMode && styles.darkCardContent]}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Full Name *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.full_name && styles.errorInputWrapper
                ]}>
                  <User size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your full name"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.full_name}
                    onChangeText={(value) => handleInputChange('full_name', value)}
                  />
                </View>
                {errors.full_name ? (
                  <Text style={styles.errorText}>{errors.full_name}</Text>
                ) : null}
              </View>
              
              {/* Username */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Username *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.username && styles.errorInputWrapper
                ]}>
                  <User size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Choose a username"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    autoCapitalize="none"
                  />
                </View>
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}
              </View>
              
              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Email *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.email && styles.errorInputWrapper
                ]}>
                  <Mail size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>
              
              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Phone Number *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.phone && styles.errorInputWrapper
                ]}>
                  <Phone size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your phone number"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}
              </View>
              
              {/* Address */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Address (Optional)</Text>
                <View style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.address && styles.errorInputWrapper
                ]}>
                  <MapPin size={18} color={isDarkMode ? '#aaa' : colors.primary} style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Enter your farm address"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Password *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.password && styles.errorInputWrapper
                ]}>
                  <Lock size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Create a password"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
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
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
              
              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Confirm Password *</Text>
                <View style={[
                  styles.inputWrapper,
                  isDarkMode && styles.darkInputWrapper,
                  errors.confirmPassword && styles.errorInputWrapper
                ]}>
                  <Lock size={18} color={isDarkMode ? '#aaa' : colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      isDarkMode && styles.darkInput
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.togglePasswordButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon size={20} color={isDarkMode ? '#aaa' : colors.primary} />
                    ) : (
                      <EyeIcon size={20} color={isDarkMode ? '#aaa' : colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>
              
              {/* Register Button */}
              <TouchableOpacity 
                onPress={handleRegister} 
                disabled={loading || authLoading}
                style={loading || authLoading ? styles.disabledButton : null}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#2E7D32', '#1B5E20'] : ['#4CAF50', '#2E7D32']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  {loading || authLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Register</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, isDarkMode && styles.darkLoginText]}>
                  Already have an account?{' '}
                  <Text
                    style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}
                    onPress={handleLogin}
                  >
                    Login
                  </Text>
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.bottomSpacing} />
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
    height: height * 0.35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: height * 0.04,
    paddingBottom: height * 0.02,
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
    paddingBottom: 30,
    zIndex: 1,
  },
  cardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    paddingVertical: 30,
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
  inputContainer: {
    marginBottom: 18,
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
  focusedInputWrapper: {
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  errorInputWrapper: {
    borderColor: '#e53935',
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
  errorText: {
    color: '#e53935',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    marginLeft: 4,
  },
  togglePasswordButton: {
    padding: 4,
  },
  registerButton: {
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
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#555',
    textAlign: 'center',
  },
  darkLoginText: {
    color: '#aaa',
  },
  bottomSpacing: {
    height: 20,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
});