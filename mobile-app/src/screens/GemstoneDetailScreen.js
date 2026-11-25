
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { priceService } from '../services/api';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const GEMSTONE_INFO = {
  Ruby: {
    description: 'Ruby is a precious corundum mineral renowned for its intense red color and exceptional hardness. It is one of the most prestigious gemstones in world gemology.',
    additional: 'Rubies display red undertones ranging from deep crimson to "pigeon blood" red. Highly prized for jewelry, engagement pieces, and heritage collections.',
    hardness: '9 on Mohs scale',
    origin: 'Myanmar, Sri Lanka, Thailand',
  },
  Sapphire: {
    description: 'Sapphire is a durable corundum celebrated for its stunning velvety blue hue and high refractive index. It symbolizes wisdom, nobility, and fidelity.',
    additional: 'Fine sapphires originate from metamorphic deposits with rich clarity and luster. Blue varieties are the benchmark, though fancy yellow and padparadscha colors also exist.',
    hardness: '9 on Mohs scale',
    origin: 'Sri Lanka, Madagascar, Australia',
  },
  Emerald: {
    description: 'Emerald is the green variety of beryl prized for its lush color and historical royalty status. It has been treasured across civilizations for thousands of years.',
    additional: 'Emeralds naturally host distinctive micro-inclusions known as the "jardin" (garden), which attest to the stone\'s natural formation and authentic provenance.',
    hardness: '7.5 - 8 on Mohs scale',
    origin: 'Colombia, Brazil, Zambia',
  },
  Diamond: {
    description: 'Diamond is pure crystallized carbon and the hardest known natural mineral on Earth, revered for unmatched dispersion fire and durability.',
    additional: 'Diamonds are universally evaluated using the Four Cs (Carat weight, Cut grade, Color grade, and Clarity). High-grade cuts maximize brilliance.',
    hardness: '10 on Mohs scale',
    origin: 'Botswana, Russia, Canada',
  },
  Amethyst: {
    description: 'Amethyst is the violet crystalline quartz variety with deep historical roots in ornamental jewelry and spiritual significance.',
    additional: 'Color spans from pale lavender to deep royal violet with dichroic color flashes. Excellent for large cut stones and collector specimens.',
    hardness: '7 on Mohs scale',
    origin: 'Brazil, Uruguay, Zambia',
  },
  Topaz: {
    description: 'Topaz is an aluminum silicate mineral available in crisp shades of imperial orange, gold, and vibrant treated blue.',
    additional: 'Possesses exceptional optical clarity and sharp facets, making it a favorite for custom gem carving and statement rings.',
    hardness: '8 on Mohs scale',
    origin: 'Brazil, Russia, Pakistan',
  },
  Citrine: {
    description: 'Citrine is the rare golden-yellow quartz known for its sunny radiance, clear crystal structure, and versatile wearability.',
    additional: 'Natural citrines display gentle champagne to Madeira amber shades with outstanding transparent vitreous luster.',
    hardness: '7 on Mohs scale',
    origin: 'Brazil, Spain, Madagascar',
  },
  Pearl: {
    description: 'Pearl is an organic gemstone created inside marine mollusks, celebrated for its orient sheen and soft iridescent beauty.',
    additional: 'Graded by nacre thickness, symmetry, surface purity, and deep reflective luster. Natural and cultured saltwater pearls are highly coveted.',
    hardness: '2.5 - 4.5 on Mohs scale',
    origin: 'Japan, Australia, Philippines',
  },
};

export default function GemstoneDetailScreen({ navigation, route }) {
  const { gem } = route.params || {};
  const fallbackInfo = GEMSTONE_INFO[gem?.name] || GEMSTONE_INFO.Ruby;
  const [dbGem, setDbGem] = useState(null);

  useEffect(() => {
    let mounted = true;
    const targetName = (gem?.name || '').trim().toLowerCase();
    if (!targetName) return;

    priceService
      .getAll()
      .then((res) => {
        if (!mounted || !res?.success || !Array.isArray(res.data)) return;
        const matched =
          res.data.find((p) => (p.gemstone_type || '').toLowerCase() === targetName) ||
          res.data.find((p) => (p.gemstone_type || '').toLowerCase().includes(targetName));
        if (matched) setDbGem(matched);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [gem?.name]);

  const descriptionText = dbGem?.description || fallbackInfo.description;
  const characteristicsText = dbGem?.characteristics || fallbackInfo.additional;
  const hardnessText = dbGem?.mohs_hardness
    ? `${dbGem.mohs_hardness} on Mohs scale`
    : fallbackInfo.hardness;
  const originText = dbGem?.primary_origins || fallbackInfo.origin;
  const sourceName = dbGem?.info_source_name || 'GIA Gem Encyclopedia';
  const sourceUrl = dbGem?.info_source_url || 'https://www.gia.edu/gem-encyclopedia';

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
          Gemstone Details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gemstone Image */}
        <View style={styles.imageContainer}>
          <Image
            source={gem?.image || require('../../assets/ruby.webp')}
            style={styles.gemImage}
            resizeMode="cover"
          />
        </View>

        {/* Gemstone Name */}
        <View style={styles.titleContainer}>
          <Text style={styles.gemName}>
            {gem?.name || 'Gemstone'}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {descriptionText}
        </Text>

        <Text style={styles.description}>
          {characteristicsText}
        </Text>

        {/* Mineral Specifications */}
        <Text style={styles.sectionHeading}>
          MINERAL SPECIFICATIONS
        </Text>

        <View style={styles.propertiesContainer}>
          <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>
              Mohs Hardness
            </Text>

            <Text style={styles.propertyValue}>
              {hardnessText}
            </Text>
          </View>

          <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>
              Primary Origins
            </Text>

            <Text style={styles.propertyValue}>
              {originText}
            </Text>
          </View>

          <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>
              Characteristic Tone
            </Text>

            <View style={styles.colorIndicatorRow}>
              <Text style={styles.propertyValue}>
                {gem?.color || '#DC143C'}
              </Text>

              <View
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: gem?.color || '#DC143C',
                  },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.propertyRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(sourceUrl).catch(() => {})}
          >
            <Text style={styles.propertyLabel}>
              Reference Source
            </Text>

            <Text style={[styles.propertyValue, { color: COLORS.primary }]}>
              {sourceName}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appraise Button */}
        <TouchableOpacity
          style={styles.appraiseButton}
          onPress={() =>
            navigation.navigate('Main', { screen: 'ScanTab' })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.appraiseButtonText}>
            Appraise this Variety
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
  },

  headerSpacer: {
    width: 36,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  // Image
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },

  gemImage: {
    width: '100%',
    height: '100%',
  },

  // Title
  titleContainer: {
    marginBottom: 12,
  },

  gemName: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 25,
    color: COLORS.darkText,
    letterSpacing: -0.4,
  },

  // Description
  description: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 12,
  },

  // Specifications
  sectionHeading: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 0.7,
    color: COLORS.textSecondary,
    marginTop: 14,
    marginBottom: 10,
  },

  propertiesContainer: {
    marginBottom: 24,
  },

  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },

  propertyLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  propertyValue: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.darkText,
    textAlign: 'right',
    flexShrink: 1,
  },

  colorIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
  },

  // Appraise Button
  appraiseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  appraiseButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.white,
  },

  bottomSpacing: {
    height: 30,
  },
});
