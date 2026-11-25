
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
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

export default function RegisterScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Input focus animations
  const inputAnimations = useRef({
    fullName: new Animated.Value(0),
    email: new Animated.Value(0),
    password: new Animated.Value(0),
    confirmPassword: new Animated.Value(0),
    otp: new Animated.Value(0),
  }).current;

  const animateFocus = (inputName, focused) => {
    Animated.timing(inputAnimations[inputName], {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const getAnimatedInputStyle = (inputName) => ({
    borderColor: inputAnimations[inputName].interpolate({
      inputRange: [0, 1],
      outputRange: ['#D1D5DB', COLORS.primary],
    }),
    borderWidth: inputAnimations[inputName].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    }),
  });

  const getInputIconColor = (inputName) =>
    focusedInput === inputName
      ? COLORS.primary
      : COLORS.textSecondary;

  const handleFocus = (inputName) => {
    setFocusedInput(inputName);
    animateFocus(inputName, true);
  };

  const handleBlur = (inputName) => {
    setFocusedInput((current) =>
      current === inputName ? null : current
    );
    animateFocus(inputName, false);
  };

  // Request OTP
  const handleRequestOtp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      showToast('Fill in all required fields.', 'error');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.sendRegisterOtp(
        email.trim(),
        fullName.trim()
      );

      if (response.success) {
        showToast(`6-digit code sent to ${email.trim()}.`, 'success');

        setStep('otp');
        setFocusedInput(null);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Send register OTP error:', error);

      let errorMessage = 'Could not send code.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Register
  const handleVerifyAndRegister = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      showToast('Enter the 6-digit verification code.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        fullName.trim(),
        email.trim(),
        password,
        otp.trim()
      );

      if (response.success) {
        showToast('Account created successfully.', 'success');
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Registration verification error:', error);

      let errorMessage = 'Invalid or expired code.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const goBackToForm = () => {
    setStep('form');
    setFocusedInput(null);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* OTP Back Header */}
      {step === 'otp' && (
        <View style={styles.topBackHeader}>
          <TouchableOpacity
            onPress={goBackToForm}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={COLORS.darkText}
            />
          </TouchableOpacity>

          <Text style={styles.topBackTitle}>
            Email Verification
          </Text>

          <View style={{ width: 36 }} />
        </View>
      )}

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
                  {step === 'form' ? (
                    <>
                      Create{' '}
                      <Text style={styles.welcomeAccent}>
                        Account
                      </Text>
                    </>
                  ) : (
                    <>
                      Verify{' '}
                      <Text style={styles.welcomeAccent}>
                        Email
                      </Text>
                    </>
                  )}
                </Text>

                <Text style={styles.welcomeSubtitle}>
                  {step === 'form'
                    ? 'Create an account to get started with Price My Gem'
                    : 'Enter the verification code sent to your email'}
                </Text>
              </View>

              {/* Registration Form */}
              <View style={styles.formContainer}>
                {step === 'form' ? (
                  <>
                    {/* Full Name */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle('fullName'),
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={19}
                        color={getInputIconColor('fullName')}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="Full name"
                        placeholderTextColor={COLORS.textLight}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        style={styles.input}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        onFocus={() => handleFocus('fullName')}
                        onBlur={() => handleBlur('fullName')}
                      />
                    </Animated.View>

                    {/* Email */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle('email'),
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={19}
                        color={getInputIconColor('email')}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="Email address"
                        placeholderTextColor={COLORS.textLight}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        style={styles.input}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                      />
                    </Animated.View>

                    {/* Password */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle('password'),
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={19}
                        color={getInputIconColor('password')}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="Password"
                        placeholderTextColor={COLORS.textLight}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        returnKeyType="next"
                        style={styles.input}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        onFocus={() => handleFocus('password')}
                        onBlur={() => handleBlur('password')}
                      />

                      <TouchableOpacity
                        onPress={() =>
                          setShowPassword(!showPassword)
                        }
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

                    {/* Confirm Password */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle('confirmPassword'),
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={19}
                        color={getInputIconColor('confirmPassword')}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="Confirm password"
                        placeholderTextColor={COLORS.textLight}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleRequestOtp}
                        style={styles.input}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        onFocus={() =>
                          handleFocus('confirmPassword')
                        }
                        onBlur={() =>
                          handleBlur('confirmPassword')
                        }
                      />

                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
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
                            showConfirmPassword
                              ? 'eye-off-outline'
                              : 'eye-outline'
                          }
                          size={20}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Continue Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        loading && styles.actionButtonDisabled,
                      ]}
                      onPress={handleRequestOtp}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                        />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          Continue
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Login Footer */}
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>
                        Already have an account?{' '}
                      </Text>

                      <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.footerLink}>
                          Sign In
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {/* OTP Notice */}
                    <View style={styles.otpNotice}>
                      <Ionicons
                        name="mail-open-outline"
                        size={20}
                        color={COLORS.primary}
                      />

                      <Text style={styles.otpNoticeText}>
                        We sent a 6-digit verification code to{' '}
                        <Text style={styles.otpEmail}>
                          {email}
                        </Text>
                      </Text>
                    </View>

                    {/* OTP Input */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle('otp'),
                      ]}
                    >
                      <Ionicons
                        name="key-outline"
                        size={19}
                        color={getInputIconColor('otp')}
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="6-digit verification code"
                        placeholderTextColor={COLORS.textLight}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="done"
                        onSubmitEditing={handleVerifyAndRegister}
                        style={styles.input}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        onFocus={() => handleFocus('otp')}
                        onBlur={() => handleBlur('otp')}
                      />
                    </Animated.View>

                    {/* Verify Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        loading && styles.actionButtonDisabled,
                      ]}
                      onPress={handleVerifyAndRegister}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                        />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          Verify & Create Account
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Resend Code */}
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>
                        Didn't receive code?{' '}
                      </Text>

                      <TouchableOpacity
                        onPress={handleRequestOtp}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.footerLink}>
                          Resend Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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

  // OTP Header
  topBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topBackTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    color: COLORS.darkText,
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

  // Actual Text Input
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

  // Action Button
  actionButton: {
    height: 49,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },

  actionButtonDisabled: {
    opacity: 0.65,
  },

  actionButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    backgroundColor: '#FFFFFF',
  },

  footerText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  footerLink: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },

  // OTP Notice
  otpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 13,
    marginBottom: 14,
    gap: 10,
  },

  otpNoticeText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.darkText,
    lineHeight: 18,
  },

  otpEmail: {
    fontFamily: FONT_FAMILIES.semiBold,
    color: COLORS.darkText,
  },
});
