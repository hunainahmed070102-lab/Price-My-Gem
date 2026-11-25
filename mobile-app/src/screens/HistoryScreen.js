
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { analysisService } from '../services/api';
import SwipeToDeleteRow from '../components/SwipeToDeleteRow';
import GemImage from '../components/GemImage';
import { formatCompactValuation, getScanStatusMeta } from '../utils/helpers';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HistoryScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openRowKey, setOpenRowKey] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ['All', 'Real', 'Synthetic', 'Uncertain'];

  // Load scan history
  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await analysisService.getHistory();

      if (res && res.success && Array.isArray(res.data)) {
        setReports(res.data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn('History loading error:', err.message);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });

    return unsubscribe;
  }, [navigation]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  // Filter and search
  const getFilteredReports = () => {
    let filtered = reports;

    if (selectedFilter !== 'All') {
      filtered = filtered.filter(
        item =>
          (item.authenticity || '').toLowerCase() ===
          selectedFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      filtered = filtered.filter(
        item =>
          (item.gemstone_type || '').toLowerCase().includes(q) ||
          (item.authenticity || '').toLowerCase().includes(q) ||
          (item.price_range || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Recently';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return 'Recently';

    const now = new Date();
    const diff = now - d;

    if (diff < 60 * 1000) return 'Just now';

    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / 60000)}m ago`;
    }

    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Open filter modal
  const openFilterModal = () => {
    setModalVisible(true);

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

  // Close filter modal
  const closeFilterModal = () => {
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
    ]).start(() => setModalVisible(false));
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    closeFilterModal();
  };

  // Open scan result
  const handleItemPress = (item) => {
    navigation.navigate('Result', {
      result: {
        gemstoneType: item.gemstone_type,
        imageUrl:
          typeof item.image_url === 'string'
            ? item.image_url
            : null,
        confidence: item.confidence,
        authenticity: item.authenticity,
        priceRange: item.price_range,
        priceDetails: item.price_details || null,
        gemstoneDetails: item.gemstone_details || null,
      },
    });
  };

  // Delete report
  const handleDeleteReport = async (item) => {
    const itemKey = String(item.id || item._id);

    setOpenRowKey(null);

    setReports(prev =>
      prev.filter(r => String(r.id || r._id) !== itemKey)
    );

    if (item.id || item._id) {
      try {
        await analysisService.deleteReport(item.id || item._id);
      } catch (err) {
        console.warn('Delete report error:', err.message);
        loadHistory();
      }
    }
  };

  // Render history card
  const renderItem = ({ item }) => {
    const itemKey = String(item.id || item._id);
    const rawConf = parseFloat(item.confidence) || 0;

    const confPct = Math.min(
      100,
      rawConf <= 1 ? rawConf * 100 : rawConf
    );

    const { authText, color: statusColor } = getScanStatusMeta(
      item.authenticity
    );

    return (
      <SwipeToDeleteRow
        isOpen={openRowKey === itemKey}
        onOpen={() => setOpenRowKey(itemKey)}
        onSwipeStart={() => {
          if (openRowKey && openRowKey !== itemKey) {
            setOpenRowKey(null);
          }
        }}
        onDelete={() => handleDeleteReport(item)}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.85}
        >
          <View style={styles.thumbnailContainer}>
            <GemImage
              imageUrl={item.image_url}
              gemstoneType={item.gemstone_type}
              style={styles.thumbnail}
            />
          </View>

          <View style={styles.info}>
            <View style={styles.topRow}>
              <Text style={styles.gemstoneType} numberOfLines={1}>
                {item.gemstone_type || 'Unknown Gemstone'}
              </Text>

              <Text style={styles.price} numberOfLines={1}>
                {formatCompactValuation(item)}
              </Text>
            </View>

            <View style={styles.bottomRow}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {authText}  {confPct.toFixed(0)}%
              </Text>

              <Text style={styles.date}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeToDeleteRow>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
      </View>

      {/* Search & Filter */}
      <View
        style={[
          styles.searchContainer,
          searchFocused && styles.searchContainerFocused,
        ]}
      >
        <Search
          size={17}
          color={searchFocused ? COLORS.primary : COLORS.textSecondary}
          strokeWidth={2}
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search scans..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.searchActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X
              size={16}
              color={searchFocused ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={openFilterModal}
          style={styles.searchFilterBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel="Filter scans"
        >
          <SlidersHorizontal
            size={17}
            color={
              selectedFilter !== 'All' || searchFocused
                ? COLORS.primary
                : COLORS.textSecondary
            }
            strokeWidth={2}
          />
          {selectedFilter !== 'All' && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* History List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            String(item.id || item._id || index)
          }
          contentContainerStyle={[
            styles.listContent,
            filteredReports.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => (
            <View style={styles.rowDivider} />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptySubtitle}>
                {reports.length === 0 ? 'No reports found' : 'No results found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeFilterModal}
      >
        <TouchableWithoutFeedback onPress={closeFilterModal}>
          <Animated.View
            style={[styles.modalOverlay, { opacity: fadeAnim }]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Filter Scans</Text>
                    <Text style={styles.modalSubtitle}>
                      Select gemstone authenticity
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeFilterModal}
                  >
                    <Ionicons
                      name="close"
                      size={21}
                      color={COLORS.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalOptions}>
                  {filters.map((f, idx) => {
                    const isSelected = selectedFilter === f;
                    return (
                      <View key={f}>
                        <TouchableOpacity
                          style={styles.modalOption}
                          onPress={() => handleFilterSelect(f)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.modalOptionText,
                              isSelected && styles.modalOptionTextActive,
                            ]}
                          >
                            {f}
                          </Text>
                          <View
                            style={[
                              styles.modalOptionDash,
                              isSelected && styles.modalOptionDashActive,
                            ]}
                          />
                        </TouchableOpacity>
                        {idx < filters.length - 1 && (
                          <View style={styles.modalDivider} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 13,
    height: 44,
  },

  searchContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.darkText,
    paddingVertical: 0,
  },

  searchActionBtn: {
    paddingLeft: 8,
  },

  searchFilterBtn: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  filterActiveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  // List
  listContent: {
    paddingBottom: 24,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  rowDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  // History Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },

  thumbnailContainer: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
  },

  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  info: {
    flex: 1,
    gap: 6,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  gemstoneType: {
    flex: 1,
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.darkText,
  },

  price: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    color: COLORS.primary,
    flexShrink: 0,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  date: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 40,
    gap: 12,
  },

  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  emptyTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 17,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 30,
  },

  scanCtaText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  clearSearchButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  clearSearchText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 23, 66, 0.40)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 17,
    color: COLORS.textPrimary,
  },

  modalSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOptions: {
    width: '100%',
  },

  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  modalDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  modalOptionText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  modalOptionTextActive: {
    fontFamily: FONT_FAMILIES.semiBold,
    color: COLORS.primary,
  },

  modalOptionDash: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.border,
  },

  modalOptionDashActive: {
    width: 24,
    height: 2.5,
    backgroundColor: COLORS.primary,
  },
});
