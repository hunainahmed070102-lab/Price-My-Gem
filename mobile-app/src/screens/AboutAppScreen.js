
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function AboutAppScreen({ navigation }) {
  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.surface}
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
            size={21}
            color={COLORS.darkText}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>About App</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Information */}
        <View style={styles.brandHero}>
          <Image
            source={require('../../assets/app.webp')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.appName}>Price My Gem</Text>

          <Text style={styles.versionText}>VERSION 1.0.0</Text>

          <Text style={styles.description}>
            Price My Gem is an AI-powered gemstone identification and
            valuation platform. It uses deep learning technology and
            gemstone market data to identify different gemstone varieties,
            assess their authenticity, and provide estimated carat values.
          </Text>
        </View>

        {/* Copyright */}
        <View style={styles.legalSection}>
          <Text style={styles.legalNotice}>
            © 2026 Price My Gem Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerSpacer: {
    width: 36,
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },

  brandHero: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 28,
  },

  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 14,
  },

  appName: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 22,
    color: COLORS.darkText,
    marginBottom: 5,
  },

  versionText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  description: {
    width: '100%',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 5,
  },

  legalSection: {
    alignItems: 'center',
    marginTop: 30,
  },

  legalNotice: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textLight,
  },
});
