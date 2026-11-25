import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GemImage from '../components/GemImage';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

export default function ResultScreen({ route, navigation }) {
  const result = route.params?.result || {};
  const localImageUri = route.params?.imageUri;

  const getConfidenceDisplay = (val) => {
    if (val === undefined || val === null) return '0.0%';
    const num = parseFloat(val);
    if (isNaN(num)) return '0.0%';
    const pct = num <= 1.0 ? num * 100 : num;
    return `${pct.toFixed(1)}%`;
  };

  const formatTitleCase = (val, fallback) => {
    const raw = String(val || fallback || '').trim();
    if (!raw) return fallback;
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  };

  const gemstoneType = result.gemstoneType || result.gemstone_type || 'Unknown Gemstone';
  const authLabel = formatTitleCase(result.authenticity, 'Real');
  const authLower = authLabel.toLowerCase();

  let statusColor = COLORS.success;
  let specimenStatus = 'Natural Specimen';

  if (authLower === 'synthetic') {
    statusColor = COLORS.error;
    specimenStatus = 'Lab-Created Specimen';
  } else if (authLower === 'uncertain') {
    statusColor = COLORS.warning;
    specimenStatus = 'Moderate Confidence';
  }

  const formatPriceDisplay = (rawPrice, priceDetails) => {
    if (priceDetails?.pricePerCarat !== undefined && priceDetails?.pricePerCarat !== null) {
      return {
        main: `Rs ${Number(priceDetails.pricePerCarat).toLocaleString()}`,
        unit: `${priceDetails.currency || 'PKR'} per carat`,
      };
    }

    const text = String(rawPrice || '').trim();
    if (!text) {
      return { main: 'Price on request', unit: null };
    }

    if (/^[\d,]+(\.\d+)?$/.test(text)) {
      const numeric = Number(text.replace(/,/g, ''));
      return {
        main: `Rs ${numeric.toLocaleString()}`,
        unit: 'per carat',
      };
    }

    const perCaratMatch = text.match(/^(.+?)\s*([A-Z]{3})?\s*\/\s*(?:carat|ct)$/i);
    if (perCaratMatch) {
      const amount = perCaratMatch[1].trim();
      const currency = perCaratMatch[2] ? `${perCaratMatch[2].toUpperCase()} ` : '';
      return {
        main: amount,
        unit: `${currency}per carat`,
      };
    }

    return { main: text, unit: null };
  };

  const confidenceStr = getConfidenceDisplay(result.confidence);
  const priceDisplay = formatPriceDisplay(
    result.priceRange || result.price_range,
    result.priceDetails
  );
  const topCandidates = result.topCandidates || result.top_candidates || [];
  const remoteImageUrl = result.imageUrl || result.image_url || null;
  const gemDetails = result.gemstoneDetails || result.gemstone_details || null;
  const primarySourceName =
    gemDetails?.infoSourceName || gemDetails?.sources?.[0]?.source_name || null;
  const primarySourceUrl =
    gemDetails?.infoSourceUrl || gemDetails?.sources?.[0]?.source_url || null;

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.darkText} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan Result</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Specimen Photo */}
        <View style={styles.imageContainer}>
          <GemImage
            localUri={localImageUri}
            imageUrl={remoteImageUrl}
            gemstoneType={gemstoneType}
            style={styles.gemImage}
            resizeMode="cover"
          />
        </View>

        {/* Primary Title & Valuation on Same Line */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.gemName} numberOfLines={2}>
              {gemstoneType}
            </Text>
            <View style={styles.priceBlock}>
              <Text style={styles.priceValue} numberOfLines={1}>
                {priceDisplay.main}
              </Text>
              {priceDisplay.unit ? (
                <Text style={styles.priceUnit}>{priceDisplay.unit}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.disclaimerText}>
            Estimated wholesale benchmark based on optical clarity and facet geometry.
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Authenticity</Text>
            <Text style={[styles.detailValue, { color: statusColor }]}>
              {authLabel}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Classification</Text>
            <Text style={styles.detailValue}>{specimenStatus}</Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence</Text>
            <Text style={styles.detailValue}>{confidenceStr}</Text>
          </View>

          {result.priceDetails ? (
            <>
              <View style={styles.rowDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base Reference</Text>
                <Text style={styles.detailValue}>
                  Rs {Number(result.priceDetails.pricePerCarat).toLocaleString()}{' '}
                  {result.priceDetails.currency || 'PKR'} / ct
                </Text>
              </View>
            </>
          ) : null}

          {gemDetails?.mineralFamily ? (
            <>
              <View style={styles.rowDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mineral Family</Text>
                <Text style={styles.detailValue}>{gemDetails.mineralFamily}</Text>
              </View>
            </>
          ) : null}

          {gemDetails?.mohsHardness ? (
            <>
              <View style={styles.rowDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mohs Hardness</Text>
                <Text style={styles.detailValue}>{gemDetails.mohsHardness}</Text>
              </View>
            </>
          ) : null}

          {primarySourceName ? (
            <>
              <View style={styles.rowDivider} />
              <TouchableOpacity
                style={styles.detailRow}
                activeOpacity={0.7}
                disabled={!primarySourceUrl}
                onPress={() => {
                  if (primarySourceUrl) {
                    Linking.openURL(primarySourceUrl).catch(() => {});
                  }
                }}
              >
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={[styles.detailValue, primarySourceUrl && { color: COLORS.primary }]}>
                  {primarySourceName}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Top Predictions */}
        {topCandidates.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionHeading}>Top Predictions</Text>

            <View style={styles.candidatesContainer}>
              {topCandidates.slice(0, 3).map((item, idx) => {
                const gemName =
                  item.gemstone || item.gemstone_type || `Candidate ${idx + 1}`;
                const confDisplay = getConfidenceDisplay(item.confidence);
                const isTop = idx === 0;

                return (
                  <View key={`${gemName}-${idx}`}>
                    <View style={styles.candidateRow}>
                      <View style={styles.candidateLeft}>
                        <Text style={styles.candidateRank}>#{idx + 1}</Text>
                        <Text
                          style={[
                            styles.candidateName,
                            isTop && styles.candidateNameActive,
                          ]}
                        >
                          {gemName}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.candidateConf,
                          isTop && styles.candidateConfActive,
                        ]}
                      >
                        {confDisplay}
                      </Text>
                    </View>
                    {idx < Math.min(topCandidates.length, 3) - 1 && (
                      <View style={styles.rowDivider} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => navigation.navigate('Main', { screen: 'ScanTab' })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryCtaText}>Scan Another Gemstone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => navigation.navigate('Main', { screen: 'HistoryTab' })}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryCtaText}>View Scan History</Text>
          </TouchableOpacity>
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  imageContainer: {
    width: '100%',
    height: 225,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 18,
  },

  gemImage: {
    width: '100%',
    height: '100%',
  },

  titleSection: {
    marginBottom: 4,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },

  gemName: {
    flex: 1,
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 23,
    color: COLORS.darkText,
    letterSpacing: -0.4,
  },

  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '52%',
  },

  priceValue: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 20,
    color: COLORS.primary,
    textAlign: 'right',
    letterSpacing: -0.3,
  },

  priceUnit: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 1,
  },

  disclaimerText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 18,
  },

  rowDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  sectionHeading: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: COLORS.darkText,
    marginBottom: 8,
  },

  detailsContainer: {
    marginTop: 14,
    marginBottom: 4,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },

  detailLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },

  detailValue: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.darkText,
    textAlign: 'right',
    flexShrink: 1,
  },

  candidatesContainer: {
    marginBottom: 8,
  },

  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  candidateRank: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 24,
  },

  candidateName: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    color: COLORS.darkText,
  },

  candidateNameActive: {
    fontFamily: FONT_FAMILIES.semiBold,
    color: COLORS.primary,
  },

  candidateConf: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  candidateConfActive: {
    color: COLORS.primary,
  },

  actionContainer: {
    marginTop: 22,
    gap: 10,
  },

  primaryCta: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  primaryCtaText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  secondaryCta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 30,
  },

  secondaryCtaText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
