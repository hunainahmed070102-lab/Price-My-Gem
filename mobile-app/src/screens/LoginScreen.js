
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Linking,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { isValidEmail } from '../utils/helpers';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function LoginScreen({ navigation }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Smooth input focus animations
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;

  const animateFocus = (anim, focused) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const getAnimatedInputStyle = (anim) => ({
    borderColor: anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#D1D5DB', COLORS.primary],
    }),
    borderWidth: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    }),
  });

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast('Please enter email and password.', 'error');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(
        email.trim(),
        password
      );

      if (response.success) {
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response?.data?.blocked) {
        const { contactEmail, contactWhatsApp } =
          error.response.data;

        Alert.alert(
          'Account Blocked',
          'Account blocked. Contact support.',
          [
            {
              text: 'Email Support',
              onPress: () => {
                const emailUrl = `mailto:${contactEmail}?subject=Account Blocked - Help Needed`;

                Linking.openURL(emailUrl).catch(() => {
                  showToast('Could not open email app.', 'error');
                });
              },
            },
            {
              text: 'WhatsApp Support',
              onPress: () => {
                const whatsappUrl = `whatsapp://send?phone=${contactWhatsApp}&text=Hi, my account has been blocked. I need help.`;

                Linking.openURL(whatsappUrl).catch(() => {
                  showToast('Could not open WhatsApp.', 'error');
                });
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );

        return;
      }

      let errorMessage = 'Invalid email or password.';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timed out.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>

              {/* Welcome Header */}
              <View style={styles.header}>
                <Text style={styles.welcomeTitle}>
                  Welcome{' '}
                  <Text style={styles.welcomeAccent}>Back</Text>
                </Text>

                <Text style={styles.welcomeSubtitle}>
                  Sign in to continue to Price My Gem
                </Text>
              </View>

              {/* Login Form */}
              <View style={styles.formContainer}>

                {/* Email Input */}
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    getAnimatedInputStyle(emailFocusAnim),
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={
                      emailFocused
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => {
                      setEmailFocused(true);
                      animateFocus(emailFocusAnim, true);
                    }}
                    onBlur={() => {
                      setEmailFocused(false);
                      animateFocus(emailFocusAnim, false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    underlineColorAndroid="transparent"
                    selectionColor={COLORS.primary}
                    style={styles.input}
                  />
                </Animated.View>

                {/* Password Input */}
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    getAnimatedInputStyle(passwordFocusAnim),
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={
                      passwordFocused
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      setPasswordFocused(true);
                      animateFocus(passwordFocusAnim, true);
                    }}
                    onBlur={() => {
                      setPasswordFocused(false);
                      animateFocus(passwordFocusAnim, false);
                    }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    underlineColorAndroid="transparent"
                    selectionColor={COLORS.primary}
                    style={styles.input}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{
                      top: 10,
                      bottom: 10,
                      left: 10,
                      right: 10,
                    }}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxActive,
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={COLORS.white}
                        />
                      )}
                    </View>

                    <Text style={styles.rememberMeText}>
                      Remember Me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ForgotPassword')
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.white}
                    />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      Login
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Register Footer */}
                <View style={styles.footerRow}>
                  <Text style={styles.noAccountText}>
                    Don't have an account?{' '}
                  </Text>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signUpText}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  // Main Screen - Pure White Background
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 35,
    backgroundColor: '#FFFFFF',
  },

  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Welcome Header
  header: {
    alignItems: 'center',
    marginBottom: 22,
    backgroundColor: '#FFFFFF',
  },

  welcomeTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 25,
    color: COLORS.darkText,
    letterSpacing: -0.5,
  },

  welcomeAccent: {
    color: COLORS.primary,
  },

  welcomeSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 7,
    textAlign: 'center',
  },

  // Form
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },

  // Input Wrapper
  inputWrapper: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 13,
    marginBottom: 12,
    overflow: 'hidden',
  },

  inputIcon: {
    marginRight: 11,
  },

  // Actual TextInput
  input: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FFFFFF',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.darkText,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    borderWidth: 0,
  },

  eyeIcon: {
    paddingLeft: 10,
    paddingVertical: 5,
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },

  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.textSecondary,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },

  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  rememberMeText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  forgotPasswordText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
    color: COLORS.primary,
  },

  // Login Button
  loginButton: {
    height: 49,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Register Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    backgroundColor: '#FFFFFF',
  },

  noAccountText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  signUpText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },

});
