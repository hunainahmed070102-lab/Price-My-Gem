import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.dateStamp}>LAST UPDATED: NOVEMBER 2026</Text>

          <Text style={styles.sectionTitle}>1. Data We Collect</Text>
          <Text style={styles.bodyText}>
            We collect authentication credentials (email and full name) and gemstone photographs submitted for AI inference. Scan history is stored securely for your personal appraisal logs.
          </Text>

          <Text style={styles.sectionTitle}>2. Model Inference & Privacy</Text>
          <Text style={styles.bodyText}>
            Uploaded gemstone images are processed by our on-premises LiteRT inference pipeline solely to perform species classification, guardrail validation, and appraisal calculation. We do not sell or monetize user scan images.
          </Text>

          <Text style={styles.sectionTitle}>3. Storage & Security</Text>
          <Text style={styles.bodyText}>
            User passwords are encrypted with industry-standard bcrypt hashing. Sessions are authenticated via signed JSON Web Tokens (JWT).
          </Text>

          <Text style={styles.sectionTitle}>4. Contact Us</Text>
          <Text style={styles.bodyText}>
            If you have questions regarding your data or wish to delete your account and scan records, contact us at privacy@pricemygem.com.
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  dateStamp: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.darkText,
    marginTop: 14,
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
