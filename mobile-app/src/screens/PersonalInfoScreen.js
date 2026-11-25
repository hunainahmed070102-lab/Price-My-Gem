
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PersonalInfoScreen({ navigation }) {
  const { showToast } = useToast();
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const loadUserData = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      const savedName = await AsyncStorage.getItem('fullName');

      if (savedImage) setProfileImage(savedImage);
      if (savedName) setFullName(savedName);

      const userStr = await AsyncStorage.getItem('user');

      if (userStr) {
        const userData = JSON.parse(userStr);

        if (userData.email) {
          setEmail(userData.email);
        } else if (userData.user?.email) {
          setEmail(userData.user.email);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const openImageOptions = () => {
    setShowImageOptions(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeImageOptions = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowImageOptions(false);
    });
  };

  const handleTakePhoto = async () => {
    closeImageOptions();

    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast('Allow camera permission in settings.', 'error');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const imageUri = result.assets[0].uri;

          setProfileImage(imageUri);
          await AsyncStorage.setItem('profileImage', imageUri);
        }
      } catch (error) {
        showToast('Could not open camera.', 'error');
      }
    }, 250);
  };

  const handleChooseFromGallery = async () => {
    closeImageOptions();

    setTimeout(async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const imageUri = result.assets[0].uri;

          setProfileImage(imageUri);
          await AsyncStorage.setItem('profileImage', imageUri);
        }
      } catch (error) {
        Alert.alert('Error', 'Could not select photo.');
      }
    }, 250);
  };

  const handleSaveChanges = async () => {
    if (!fullName.trim()) {
      showToast('Enter your full name.', 'error');
      return;
    }

    setSaving(true);

    try {
      await authService.updateProfile(fullName.trim());

      if (profileImage) {
        await AsyncStorage.setItem('profileImage', profileImage);
      }

      await AsyncStorage.setItem('fullName', fullName.trim());

      showToast('Profile updated.', 'success');
      navigation.goBack();
    } catch (error) {
      let errorMessage = 'Could not save changes.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
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
          Personal Info
        </Text>

        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require('../../assets/profile_pic.webp')
                }
                style={styles.avatarImage}
              />

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={openImageOptions}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarHint}>
              Tap camera to update profile photo
            </Text>
          </View>

          {/* Personal Information Fields */}
          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name
              </Text>

              <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={nameFocused ? COLORS.primary : COLORS.textSecondary}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="Enter full name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address (Verified)
              </Text>

              <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={email}
                  editable={false}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.textLight}
                />

                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={COLORS.textLight}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveChanges}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Image Options Modal */}
        <Modal
          visible={showImageOptions}
          transparent={true}
          animationType="none"
          onRequestClose={closeImageOptions}
        >
          <TouchableWithoutFeedback onPress={closeImageOptions}>
            <Animated.View
              style={[
                styles.modalOverlay,
                { opacity: fadeAnim },
              ]}
            >
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.bottomSheet,
                    {
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.handleBar} />

                  <Text style={styles.sheetTitle}>
                    Change Profile Photo
                  </Text>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleTakePhoto}
                  >
                    <View style={styles.optionIconBox}>
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>
                        Take Photo
                      </Text>

                      <Text style={styles.optionSubtitle}>
                        Use camera to snap a new picture
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.optionDivider} />

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleChooseFromGallery}
                  >
                    <View style={styles.optionIconBox}>
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>
                        Choose from Gallery
                      </Text>

                      <Text style={styles.optionSubtitle}>
                        Select from your photo library
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelSheetButton}
                    onPress={closeImageOptions}
                  >
                    <Text style={styles.cancelSheetText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
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

  // Header
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

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },

  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  avatarHint: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
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

  readOnlyWrapper: {
    backgroundColor: COLORS.surfaceLight,
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

  readOnlyInput: {
    color: COLORS.textSecondary,
  },

  // Save Button
  saveButton: {
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

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 0.4,
  },

  // Image Options Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  sheetTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
    color: COLORS.darkText,
    marginBottom: 16,
    textAlign: 'center',
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  optionTextContainer: {
    flex: 1,
  },

  optionTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.darkText,
    marginBottom: 1,
  },

  optionSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  optionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  cancelSheetButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cancelSheetText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
