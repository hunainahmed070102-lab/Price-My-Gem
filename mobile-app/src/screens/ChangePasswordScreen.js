
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function ChangePasswordScreen({ navigation }) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) {
      return {
        label: '',
        color: COLORS.textLight,
        width: '0%',
      };
    }

    const length = password.length;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecial,
    ].filter(Boolean).length;

    if (length < 6) {
      return { label: 'Too short', color: COLORS.error, width: '25%' };
    } else if (length >= 6 && score <= 1) {
      return { label: 'Weak', color: COLORS.warning, width: '50%' };
    } else if (length >= 8 && score >= 2 && score < 4) {
      return { label: 'Good', color: COLORS.secondary, width: '75%' };
    } else if (length >= 8 && score >= 4) {
      return { label: 'Strong', color: COLORS.success, width: '100%' };
    }

    return { label: 'Fair', color: COLORS.secondary, width: '60%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleConfirm = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword(
        currentPassword,
        newPassword
      );

      if (response.success) {
        showToast('Password updated. Please sign in again.', 'success');
        await authService.logout();
        navigation.replace('Login');
      }
    } catch (error) {
      let errorMessage = 'Could not change password.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect.';
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = ({
    fieldKey,
    label,
    placeholder,
    value,
    onChangeText,
    visible,
    onToggleVisibility,
    returnKeyType,
    onSubmitEditing,
  }) => {
    const isFocused = focusedField === fieldKey;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>

        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={isFocused ? COLORS.primary : COLORS.textSecondary}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
            returnKeyType={returnKeyType || 'next'}
            onSubmitEditing={onSubmitEditing}
          />

          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={onToggleVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.darkText}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Change Password
        </Text>

        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContent}>

              {/* Current Password */}
              {renderPasswordInput({
                fieldKey: 'current',
                label: 'Current Password',
                placeholder: 'Enter current password',
                value: currentPassword,
                onChangeText: setCurrentPassword,
                visible: showCurrentPassword,
                onToggleVisibility: () =>
                  setShowCurrentPassword(!showCurrentPassword),
              })}

              {/* New Password */}
              {renderPasswordInput({
                fieldKey: 'new',
                label: 'New Password',
                placeholder: 'Min. 6 characters',
                value: newPassword,
                onChangeText: setNewPassword,
                visible: showNewPassword,
                onToggleVisibility: () =>
                  setShowNewPassword(!showNewPassword),
              })}

              {/* Password Strength */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: passwordStrength.width,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.strengthText,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              {/* Confirm New Password */}
              {renderPasswordInput({
                fieldKey: 'confirm',
                label: 'Confirm New Password',
                placeholder: 'Repeat new password',
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                visible: showConfirmPassword,
                onToggleVisibility: () =>
                  setShowConfirmPassword(!showConfirmPassword),
                returnKeyType: 'done',
                onSubmitEditing: handleConfirm,
              })}

              {/* Update Password Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  loading && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  // Header - Same as PersonalInfoScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
  },

  headerRight: {
    width: 36,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  // Form
  formContent: {
    width: '100%',
    backgroundColor: 'transparent',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    color: COLORS.darkText,
    marginBottom: 7,
    letterSpacing: 0.2,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },

  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.darkText,
    paddingVertical: 0,
  },

  eyeIcon: {
    padding: 4,
  },

  // Password Strength
  strengthContainer: {
    marginTop: -12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },

  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  strengthText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
    minWidth: 55,
    textAlign: 'right',
  },

  // Update Button - Same as PersonalInfoScreen
  confirmButton: {
    height: 50,
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
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  confirmButtonDisabled: {
    opacity: 0.65,
  },

  confirmButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 0.4,
  },
});
