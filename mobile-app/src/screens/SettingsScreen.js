
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
  Share,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const INVITE_MESSAGE = `Price My Gem — AI Gemstone Identification & Valuation

• Identify any gemstone in seconds with precision AI
• Accurate market price estimates per carat
• Real-time authenticity verification

Explore now: https://pricemygem.com`;

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileImage();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      const savedName = await AsyncStorage.getItem('fullName');

      setProfileImage(savedImage || null);
      setFullName(savedName || '');
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      await loadProfileImage();
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    const rootNav = navigation.getParent() || navigation;

    if (rootNav.reset) {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      navigation.replace('Login');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              resetToLogin();
            } catch (error) {
              Alert.alert('Error', 'Could not log out.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Permanently delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);

              await authService.deleteAccount();
              resetToLogin();
            } catch (error) {
              const errMsg =
                error.response?.data?.message || 'Could not delete account.';

              Alert.alert('Delete Failed', errMsg);
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: INVITE_MESSAGE,
        title: 'Price My Gem',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share.');
    }
  };

  const navigateTo = (screen) => {
    navigation.getParent()?.navigate(screen);
  };

  const getUserName = () => {
    if (fullName && fullName.trim()) {
      return fullName;
    }

    if (user?.email) {
      const name = user.email.split('@')[0];

      return name
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Gem Collector';
  };

  const renderMenuItem = (icon, label, onPress, options = {}) => {
    const isDanger = !!options.danger;
    const showArrow = options.showArrow !== false;
    const itemColor = isDanger ? COLORS.error : COLORS.primary;

    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={options.disabled}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.iconWrapper}>
            {options.loading ? (
              <ActivityIndicator
                size="small"
                color={itemColor}
              />
            ) : (
              <Ionicons
                name={icon}
                size={19}
                color={itemColor}
              />
            )}
          </View>

          <Text
            style={[
              styles.menuItemLabel,
              isDanger && styles.dangerLabel,
            ]}
          >
            {label}
          </Text>
        </View>

        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={17}
            color={itemColor}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileRow}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../assets/profile_pic.webp')
            }
            style={styles.profileImage}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {getUserName()}
            </Text>

            <Text
              style={styles.profileEmail}
              numberOfLines={1}
            >
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>

        {/* Profile & Security */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            'person-outline',
            'Personal Info',
            () => navigateTo('PersonalInfo')
          )}

          <View style={styles.divider} />

          {renderMenuItem(
            'lock-closed-outline',
            'Change Password',
            () => navigateTo('ChangePassword')
          )}

          <View style={styles.divider} />

          {renderMenuItem(
            'time-outline',
            'Scan History',
            () => navigation.navigate('HistoryTab')
          )}

          <View style={styles.divider} />

          {/* Information */}
          {renderMenuItem(
            'share-social-outline',
            'Invite Friends',
            handleInviteFriend,
            { showArrow: false }
          )}

          <View style={styles.divider} />

          {renderMenuItem(
            'information-circle-outline',
            'About Price My Gem',
            () => navigateTo('AboutApp')
          )}

          <View style={styles.divider} />

          {renderMenuItem(
            'trash-outline',
            'Delete Account',
            handleDeleteAccount,
            {
              danger: true,
              showArrow: false,
              loading: deletingAccount,
              disabled: deletingAccount,
            }
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 10,
  },

  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },

  profileName: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    color: COLORS.darkText,
    marginBottom: 4,
  },

  profileEmail: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Menu Sections
  menuSection: {
    width: '100%',
  },

  // Equal height for every menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
    paddingVertical: 0,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconWrapper: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  menuItemLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    color: COLORS.darkText,
  },

  dangerLabel: {
    color: COLORS.error,
  },

  // Dividers between menu items
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  // Logout
  logoutButton: {
    height: 49,
    borderRadius: 30,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: COLORS.error,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },

  logoutText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
