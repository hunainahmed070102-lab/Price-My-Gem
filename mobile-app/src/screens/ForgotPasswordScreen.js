
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

export default function ForgotPasswordScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const otpFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const confirmFocusAnim = useRef(new Animated.Value(0)).current;

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

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      showToast('Enter your email address.', 'error');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());

      if (response.success) {
        showToast(`6-digit code sent to ${email.trim()}.`, 'success');
        setStep('otp');
      }
    } catch (error) {
      console.error('Forgot password error:', error);

      let errMsg = 'Could not send code.';

      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }

      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    if (!otp.trim()) {
      showToast('Enter the 6-digit verification code.', 'error');
      return;
    }

    if (otp.trim().length !== 6) {
      showToast('Code must be 6 digits.', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(
        email.trim(),
        otp.trim(),
        newPassword
      );

      if (response.success) {
        showToast('Password reset. Sign in with your new password.', 'success');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Reset password error:', error);

      let errMsg = 'Could not reset password.';

      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }

      showToast(errMsg, 'error');
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
                  {step === 'email' ? 'Forgot ' : 'Reset '}
                  <Text style={styles.welcomeAccent}>
                    Password
                  </Text>
                </Text>

                <Text style={styles.welcomeSubtitle}>
                  {step === 'email'
                    ? 'Enter your email to receive a recovery code'
                    : 'Create a new password for your account'}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>

                {step === 'email' ? (
                  <>
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
                        returnKeyType="done"
                        onSubmitEditing={handleSendOtp}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        style={styles.input}
                      />
                    </Animated.View>

                    {/* Send Recovery Code */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        loading && styles.actionButtonDisabled,
                      ]}
                      onPress={handleSendOtp}
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
                          Send Recovery Code
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>
                        Remember your password?{' '}
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
                        size={19}
                        color={COLORS.primary}
                      />

                      <Text style={styles.otpNoticeText}>
                        Verification code sent to{' '}
                        <Text style={styles.emailHighlight}>
                          {email}
                        </Text>
                      </Text>
                    </View>

                    {/* OTP Input */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle(otpFocusAnim),
                      ]}
                    >
                      <Ionicons
                        name="key-outline"
                        size={19}
                        color={
                          otpFocused
                            ? COLORS.primary
                            : COLORS.textSecondary
                        }
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="6-digit verification code"
                        placeholderTextColor={COLORS.textLight}
                        value={otp}
                        onChangeText={setOtp}
                        onFocus={() => {
                          setOtpFocused(true);
                          animateFocus(otpFocusAnim, true);
                        }}
                        onBlur={() => {
                          setOtpFocused(false);
                          animateFocus(otpFocusAnim, false);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="next"
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        style={styles.input}
                      />
                    </Animated.View>

                    {/* New Password */}
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
                        placeholder="New password"
                        placeholderTextColor={COLORS.textLight}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        onFocus={() => {
                          setPasswordFocused(true);
                          animateFocus(passwordFocusAnim, true);
                        }}
                        onBlur={() => {
                          setPasswordFocused(false);
                          animateFocus(passwordFocusAnim, false);
                        }}
                        secureTextEntry={!showPassword}
                        returnKeyType="next"
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

                    {/* Confirm Password */}
                    <Animated.View
                      style={[
                        styles.inputWrapper,
                        getAnimatedInputStyle(confirmFocusAnim),
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={19}
                        color={
                          confirmFocused
                            ? COLORS.primary
                            : COLORS.textSecondary
                        }
                        style={styles.inputIcon}
                      />

                      <TextInput
                        placeholder="Confirm new password"
                        placeholderTextColor={COLORS.textLight}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => {
                          setConfirmFocused(true);
                          animateFocus(confirmFocusAnim, true);
                        }}
                        onBlur={() => {
                          setConfirmFocused(false);
                          animateFocus(confirmFocusAnim, false);
                        }}
                        secureTextEntry={!showConfirmPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                        underlineColorAndroid="transparent"
                        selectionColor={COLORS.primary}
                        style={styles.input}
                      />

                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
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

                    {/* Update Password */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        loading && styles.actionButtonDisabled,
                      ]}
                      onPress={handleResetPassword}
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
                          Update Password
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Resend Code */}
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>
                        Didn't receive the code?{' '}
                      </Text>

                      <TouchableOpacity
                        onPress={handleSendOtp}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.footerLink}>
                          Resend
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
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
  },

  welcomeTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 25,
    color: COLORS.darkText,
    letterSpacing: -0.5,
    textAlign: 'center',
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

  // OTP Notice
  otpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },

  otpNoticeText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  emailHighlight: {
    fontFamily: FONT_FAMILIES.semiBold,
    color: COLORS.darkText,
  },

  // Action Button
  actionButton: {
    height: 49,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
});
