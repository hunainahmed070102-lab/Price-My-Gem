import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GemImage from '../components/GemImage';
import SwipeToDeleteRow from '../components/SwipeToDeleteRow';
import { analysisService } from '../services/api';
import { formatCompactValuation, getScanStatusMeta } from '../utils/helpers';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { width } = Dimensions.get('window');

const GEMSTONES = [
  {
    name: 'Ruby',
    image: require('../../assets/ruby.webp'),
    description: 'Ruby is a precious gemstone known for its deep red color. It is one of the most valuable gemstones and symbolizes passion, protection, and prosperity.',
    color: '#DC143C',
    hardness: '9 on Mohs scale',
    origin: 'Myanmar, Sri Lanka, Thailand',
  },
  {
    name: 'Sapphire',
    image: require('../../assets/sapphire.webp'),
    description: 'Sapphire is a precious gemstone famous for its stunning blue color. It represents wisdom, loyalty, and nobility.',
    color: '#0F52BA',
    hardness: '9 on Mohs scale',
    origin: 'Sri Lanka, Madagascar, Australia',
  },
  {
    name: 'Emerald',
    image: require('../../assets/emerald.webp'),
    description: 'Emerald is a precious gemstone known for its rich green color. It symbolizes rebirth, love, and wisdom.',
    color: '#50C878',
    hardness: '7.5-8 on Mohs scale',
    origin: 'Colombia, Brazil, Zambia',
  },
  {
    name: 'Diamond',
    image: require('../../assets/diamond.webp'),
    description: 'Diamond is the hardest natural substance on Earth. It is prized for its brilliance and symbolizes eternal love.',
    color: '#B9F2FF',
    hardness: '10 on Mohs scale',
    origin: 'Botswana, Russia, Canada',
  },
  {
    name: 'Amethyst',
    image: require('../../assets/amethyst.webp'),
    description: 'Amethyst is a purple quartz gemstone known for its calming energy. It represents peace, clarity, and spiritual growth.',
    color: '#9966CC',
    hardness: '7 on Mohs scale',
    origin: 'Brazil, Uruguay, Zambia',
  },
  {
    name: 'Topaz',
    image: require('../../assets/topaz.webp'),
    description: 'Topaz is a gemstone available in various colors. It symbolizes strength, intelligence, and creativity.',
    color: '#00CED1',
    hardness: '8 on Mohs scale',
    origin: 'Brazil, Russia, Pakistan',
  },
  {
    name: 'Citrine',
    image: require('../../assets/citrine.webp'),
    description: 'Citrine is a yellow to golden quartz gemstone. It represents joy, abundance, and positive energy.',
    color: '#FFB81C',
    hardness: '7 on Mohs scale',
    origin: 'Brazil, Spain, Madagascar',
  },
  {
    name: 'Pearl',
    image: require('../../assets/pearl.webp'),
    description: 'Pearl is an organic gemstone formed inside mollusks. It symbolizes purity, wisdom, and elegance.',
    color: '#E6E6E6',
    hardness: '2.5-4.5 on Mohs scale',
    origin: 'Japan, Australia, Philippines',
  },
];

const formatRelativeDate = (date) => {
  if (!date) return 'Recently';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Recently';

  const diff = Date.now() - d.getTime();
  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const BANNERS = [
  require('../../assets/banner-01.webp'),
  require('../../assets/banner-02.webp'),
];

export default function HomeScreen({ navigation }) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState('Gem Collector');
  const [recentScans, setRecentScans] = useState([]);
  const [openRowKey, setOpenRowKey] = useState(null);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isScrolling = useRef(false);

  useEffect(() => {
    loadUserProfile();
    loadRecentScans();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile();
      loadRecentScans();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRecentScans = async () => {
    try {
      const res = await analysisService.getHistory();
      if (res?.success && Array.isArray(res.data)) {
        setRecentScans(res.data.slice(0, 4));
      }
    } catch (error) {
      console.log('Error loading recent scans:', error.message);
    }
  };

  const handleDeleteRecentScan = async (item) => {
    const itemKey = String(item.id || item._id);
    setOpenRowKey(null);
    setRecentScans((prev) =>
      prev.filter((r) => String(r.id || r._id) !== itemKey)
    );

    if (item.id || item._id) {
      try {
        await analysisService.deleteReport(item.id || item._id);
        await loadRecentScans();
      } catch (error) {
        console.log('Error deleting recent scan:', error.message);
        loadRecentScans();
      }
    }
  };

  const loadUserProfile = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      const savedName = await AsyncStorage.getItem('fullName');

      if (savedImage) setProfileImage(savedImage);
      if (savedName && savedName.trim()) setUserName(savedName);
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScrolling.current) {
        const nextIndex = (currentBannerIndex + 1) % BANNERS.length;
        setCurrentBannerIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [currentBannerIndex]);

  const handleGemstonePress = (gem) => {
    navigation.navigate('GemstoneDetail', { gem });
  };

  const renderBanner = ({ item }) => (
    <View style={[styles.bannerSlide, { width: width - 40 }]}>
      <Image source={item} style={styles.bannerImage} resizeMode="cover" />
    </View>
  );

  const renderDot = (index) => {
    const inputRange = [(index - 1) * (width - 40), index * (width - 40), (index + 1) * (width - 40)];
    const dotWidth = scrollX.interpolate({
      inputRange,
      outputRange: [6, 18, 6],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.35, 1, 0.35],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[styles.dot, { width: dotWidth, opacity }]}
      />
    );
  };

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    setCurrentBannerIndex(index);
    isScrolling.current = false;
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../assets/profile_pic.webp')
            }
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.greetingText}>Hi 👋</Text>
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carousel Banners */}
        <View style={styles.bannerContainer}>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            renderItem={renderBanner}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onScrollBeginDrag={() => { isScrolling.current = true; }}
            onScrollEndDrag={() => { isScrolling.current = false; }}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: width - 40,
              offset: (width - 40) * index,
              index,
            })}
            decelerationRate="fast"
            bounces={false}
          />
          <View style={styles.dotsContainer}>
            {BANNERS.map((_, index) => renderDot(index))}
          </View>
        </View>

        {/* Popular Gemstones */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Gemstones</Text>
        </View>

        <View style={styles.gemstonesGrid}>
          {GEMSTONES.map((gem, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gemstoneCard}
              activeOpacity={0.7}
              onPress={() => handleGemstonePress(gem)}
            >
              <Image
                source={gem.image}
                style={styles.gemstoneImage}
                resizeMode="cover"
              />
              <Text style={styles.gemstoneName} numberOfLines={1}>{gem.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Scans (4 most recent with actual photos) */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('HistoryTab')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyRecentRow}
              onPress={() => navigation.navigate('ScanTab')}
              activeOpacity={0.75}
            >
              <Text style={styles.emptyRecentText}>
                No scans yet — tap here to identify your first gemstone
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            recentScans.map((item, index) => {
              const itemKey = String(item.id || item._id || index);
              const rawConf = parseFloat(item.confidence) || 0;
              const confPct = Math.min(100, rawConf <= 1 ? rawConf * 100 : rawConf);
              const { authText, color: statusColor } =
                getScanStatusMeta(item.authenticity);

              return (
                <View key={itemKey}>
                  <SwipeToDeleteRow
                    isOpen={openRowKey === itemKey}
                    onOpen={() => setOpenRowKey(itemKey)}
                    onSwipeStart={() => {
                      if (openRowKey && openRowKey !== itemKey) {
                        setOpenRowKey(null);
                      }
                    }}
                    onDelete={() => handleDeleteRecentScan(item)}
                  >
                    <TouchableOpacity
                      style={styles.recentItem}
                      onPress={() =>
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
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentImageWrap}>
                        <GemImage
                          imageUrl={item.image_url}
                          gemstoneType={item.gemstone_type}
                          style={styles.recentImage}
                        />
                      </View>
                      <View style={styles.recentInfo}>
                        <View style={styles.recentTopRow}>
                          <Text style={styles.recentName} numberOfLines={1}>
                            {item.gemstone_type || 'Unknown Gemstone'}
                          </Text>
                          <Text style={styles.recentPrice} numberOfLines={1}>
                            {formatCompactValuation(item)}
                          </Text>
                        </View>
                        <View style={styles.recentBottomRow}>
                          <Text style={[styles.recentConfidence, { color: statusColor }]} numberOfLines={1}>
                            {authText}  {confPct.toFixed(0)}%
                          </Text>
                          <Text style={styles.recentDate}>
                            {formatRelativeDate(item.created_at)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </SwipeToDeleteRow>
                  {index < recentScans.length - 1 && (
                    <View style={styles.recentDivider} />
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  greetingText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userName: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    color: COLORS.darkText,
  },
  bannerContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  bannerSlide: {
    height: 140,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    width: '100%',
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    marginHorizontal: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    color: COLORS.darkText,
  },
  gemstonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gemstoneCard: {
    width: (width - 48) / 4,
    alignItems: 'center',
    marginBottom: 14,
  },
  gemstoneImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 6,
  },
  gemstoneName: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
    color: COLORS.darkText,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 18,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  recentTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    color: COLORS.darkText,
  },
  viewAllText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  recentImageWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  recentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recentName: {
    flex: 1,
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.darkText,
  },
  recentPrice: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    color: COLORS.primary,
    flexShrink: 0,
  },
  recentStatusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentConfidence: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  recentDate: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
    color: COLORS.textLight,
  },
  recentDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  emptyRecentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  emptyRecentText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
});
