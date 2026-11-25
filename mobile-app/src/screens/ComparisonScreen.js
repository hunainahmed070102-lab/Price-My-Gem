import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Gem } from 'lucide-react-native';
import { priceService, authService } from '../services/api';
import SwipeToDeleteRow from '../components/SwipeToDeleteRow';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const GEM_THUMBNAILS = {
  ruby: require('../../assets/ruby.webp'),
  sapphire: require('../../assets/sapphire.webp'),
  emerald: require('../../assets/emerald.webp'),
  diamond: require('../../assets/diamond.webp'),
  amethyst: require('../../assets/amethyst.webp'),
  topaz: require('../../assets/topaz.webp'),
  citrine: require('../../assets/citrine.webp'),
  pearl: require('../../assets/pearl.webp'),
};

const getGemThumbnail = (gemName = '') => {
  const lower = gemName.toLowerCase();
  for (const key of Object.keys(GEM_THUMBNAILS)) {
    if (lower.includes(key)) {
      return GEM_THUMBNAILS[key];
    }
  }
  return null;
};

export default function ComparisonScreen() {
  const [priceData, setPriceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openRowKey, setOpenRowKey] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPrices();
  }, []);

  const getHiddenStorageKey = (u) => `dismissed_prices_${u?.userId || u?.id || 'guest'}`;

  const fetchPrices = async () => {
    try {
      setErrorMsg('');
      const [user, response] = await Promise.all([
        authService.getCurrentUser(),
        priceService.getAll(),
      ]);
      setCurrentUser(user);

      if (response?.success && Array.isArray(response.data)) {
        const isAdminUser = user?.role === 'admin' || user?.userType === 'admin';
        if (!isAdminUser) {
          const hiddenRaw = await AsyncStorage.getItem(getHiddenStorageKey(user));
          const hiddenSet = new Set(hiddenRaw ? JSON.parse(hiddenRaw) : []);
          setPriceData(response.data.filter((item) => !hiddenSet.has(String(item.id))));
        } else {
          setPriceData(response.data);
        }
      } else {
        setErrorMsg('Unable to load market valuations.');
      }
    } catch (err) {
      console.error('Error fetching market prices:', err);
      setErrorMsg('Could not connect to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteValuation = async (item) => {
    const itemKey = String(item.id || item.gemstone_type);
    setOpenRowKey(null);
    setPriceData((prev) => prev.filter((p) => String(p.id || p.gemstone_type) !== itemKey));

    try {
      const isAdminUser =
        currentUser?.role === 'admin' || currentUser?.userType === 'admin';

      if (isAdminUser && item.id) {
        await priceService.deletePrice(item.id);
      } else if (item.id) {
        const key = getHiddenStorageKey(currentUser);
        const hiddenRaw = await AsyncStorage.getItem(key);
        const hiddenIds = hiddenRaw ? JSON.parse(hiddenRaw) : [];
        if (!hiddenIds.includes(String(item.id))) {
          hiddenIds.push(String(item.id));
          await AsyncStorage.setItem(key, JSON.stringify(hiddenIds));
        }
      }
    } catch (err) {
      console.error('Delete valuation error:', err);
      fetchPrices();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrices();
  };

  const filteredPrices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return priceData;
    return priceData.filter((item) =>
      (item.gemstone_type || '').toLowerCase().includes(q)
    );
  }, [priceData, searchQuery]);

  const renderItem = ({ item }) => {
    const itemKey = String(item.id || item.gemstone_type);
    const thumb = getGemThumbnail(item.gemstone_type);
    const priceValue = Number(item.price_per_carat || 0).toLocaleString();
    const currency = item.currency || 'PKR';

    return (
      <SwipeToDeleteRow
        isOpen={openRowKey === itemKey}
        onOpen={() => setOpenRowKey(itemKey)}
        onSwipeStart={() => {
          if (openRowKey && openRowKey !== itemKey) {
            setOpenRowKey(null);
          }
        }}
        onDelete={() => handleDeleteValuation(item)}
      >
        <View style={styles.priceRow}>
          <View style={styles.gemLeft}>
            {thumb ? (
              <Image source={thumb} style={styles.gemThumb} resizeMode="cover" />
            ) : (
              <View style={styles.gemIconWrap}>
                <Gem size={20} color={COLORS.primary} strokeWidth={1.9} />
              </View>
            )}
            <View style={styles.gemInfo}>
              <Text style={styles.gemstoneName} numberOfLines={1}>
                {item.gemstone_type}
              </Text>
              <Text style={styles.gemstoneSub}>Market Reference</Text>
            </View>
          </View>

          <View style={styles.priceRight}>
            <Text style={styles.priceValue}>Rs {priceValue}</Text>
            <Text style={styles.priceUnit}>{currency} / carat</Text>
          </View>
        </View>
      </SwipeToDeleteRow>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace Valuations</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
        <Search
          size={17}
          color={searchFocused ? COLORS.primary : COLORS.textSecondary}
          strokeWidth={2}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gemstone..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={searchFocused ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : errorMsg && priceData.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPrices} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPrices}
          renderItem={renderItem}
          keyExtractor={(item, idx) => String(item.id || item.gemstone_type || idx)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
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
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? 'No results found' : 'No gemstones found'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  gemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  gemThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 13,
  },
  gemIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  gemInfo: {
    flex: 1,
  },
  gemstoneName: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.darkText,
    marginBottom: 2,
  },
  gemstoneSub: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 2,
  },
  priceUnit: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 24,
    height: 42,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
