
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { width } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    id: '1',
    image: require('../../assets/onboarding-01.webp'),
    title: 'Capture Your Gemstone',
    description:
      'Take a clear photo of your gemstone from any angle. Our AI will analyze it instantly.',
  },
  {
    id: '2',
    image: require('../../assets/onboarding-02.webp'),
    title: 'AI-Powered Analysis',
    description:
      'Advanced machine learning identifies your gemstone type, authenticity, and quality grade.',
  },
  {
    id: '3',
    image: require('../../assets/onboarding-03.webp'),
    title: 'Get Instant Pricing',
    description:
      'Receive accurate market valuations based on real-time data and expert analysis.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.imageSection}>
        <Image
          source={item.image}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Header */}
      <View style={styles.header}>
        <View />

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_STEPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        bounces={false}
        scrollEventThrottle={32}
        decelerationRate="fast"
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomNavigation}>

          {/* Page Indicators - Bottom Left */}
          <View style={styles.indicatorSection}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Circular Arrow Button - Bottom Right */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              currentIndex === ONBOARDING_STEPS.length - 1
                ? 'Get started'
                : 'Next slide'
            }
          >
            <Ionicons
              name="arrow-forward"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },

  // Skip Button
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  skipText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    color: COLORS.primary,
  },

  // Slides
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },

  // Image - No Card or Border
  imageSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    backgroundColor: '#FFFFFF',
  },

  onboardingImage: {
    width: width * 0.88,
    height: width * 0.88,
    maxWidth: 340,
    maxHeight: 340,
  },

  // Text
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 22,
    color: COLORS.darkText,
    letterSpacing: -0.2,
    marginBottom: 10,
    textAlign: 'center',
  },

  description: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },

  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  // Indicators
  indicatorSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginRight: 7,
  },

  indicatorActive: {
    width: 25,
    backgroundColor: COLORS.primary,
  },

  // Circular Arrow Button
  nextButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
