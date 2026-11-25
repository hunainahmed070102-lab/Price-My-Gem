import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function HelpSupportScreen({ navigation }) {
  const handleEmail = () => {
    Linking.openURL('mailto:support@pricemygem.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+15551234567');
  };

  const handleWebsite = () => {
    Linking.openURL('https://www.pricemygem.com');
  };

  const faqs = [
    {
      q: 'How does the AI identify gemstones?',
      a: 'The system uses a custom deep convolutional neural network trained on 88 gemstone classes. It extracts chromatic, crystalline, and surface facet features from your photo in under 50ms.',
    },
    {
      q: 'What triggers "This item is not a gemstone"?',
      a: 'Our out-of-distribution guardrail automatically rejects photos of non-gemstone objects (e.g., everyday objects, faces, hands, walls) when the classification confidence is below 75% or the non-gemstone class is triggered.',
    },
    {
      q: 'How are market valuations calculated?',
      a: 'Valuations are computed dynamically based on the verified gemstone species, carat weight, clarity grade, and real-time database price ranges per carat.',
    },
  ];

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Channels */}
        <Text style={styles.sectionHeading}>DIRECT CHANNELS</Text>
        <View style={styles.channelsCard}>
          <TouchableOpacity style={styles.channelRow} onPress={handleEmail} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Email Support</Text>
              <Text style={styles.channelDetail}>support@pricemygem.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.channelRow} onPress={handlePhone} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Phone Inquiries</Text>
              <Text style={styles.channelDetail}>+1 (555) 123-4567 (Mon-Fri 9-6 EST)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.channelRow} onPress={handleWebsite} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="globe-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Official Documentation</Text>
              <Text style={styles.channelDetail}>www.pricemygem.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionHeading}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqCard}>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
              {index < faqs.length - 1 && <View style={styles.faqDivider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
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
  sectionHeading: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  channelsCard: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.darkText,
    marginBottom: 2,
  },
  channelDetail: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  faqCard: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqQuestion: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.darkText,
    marginBottom: 6,
  },
  faqAnswer: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  faqDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 12,
  },
});
