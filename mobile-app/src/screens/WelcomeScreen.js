
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const pan = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;

  const buttonWidth = width - 48;
  const thumbSize = 52;
  const maxDrag = buttonWidth - thumbSize - 8;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(gestureState.dx, maxDrag)
        );

        pan.setValue(newX);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > maxDrag * 0.75) {
          nudge.stopAnimation();

          Animated.spring(pan, {
            toValue: maxDrag,
            useNativeDriver: true,
            friction: 7,
          }).start(() => {
            navigation.navigate('Onboarding');

            pan.setValue(0);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    })
  ).current;

  // Smooth circular button movement
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, {
          toValue: 8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(nudge, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      nudge.stopAnimation();
      pan.setValue(0);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.content}>

        {/* Main Hero Section */}
        <View style={styles.heroSection}>

          {/* App Logo */}
          <Image
            source={require('../../assets/app.webp')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* App Name */}
          <Text style={styles.brandTitle}>
            Price My Gem
          </Text>

        </View>

        {/* Drag to Enter */}
        <View style={styles.actionsSection}>

          <View style={styles.dragContainer}>

            <View style={styles.dragTrack}>
              <Text style={styles.dragHintText}>
                Swipe to Get Started
              </Text>
            </View>

            <Animated.View
              style={[
                styles.dragThumb,
                {
                  transform: [
                    {
                      translateX: Animated.add(pan, nudge),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.thumbInner}>
                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>

          </View>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  // Main Screen
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Hero Section
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 18,
  },

  brandTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 32,
    color: COLORS.darkText,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // Drag Button
  actionsSection: {
    width: '100%',
    alignItems: 'center',
  },

  dragContainer: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F7F5',
    position: 'relative',
    overflow: 'hidden',
  },

  dragTrack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dragHintText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },

  dragThumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },

  thumbInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 26,
  },

});
