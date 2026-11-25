import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { COLORS } from '../constants/config';

const ACTION_WIDTH = 72;

/**
 * Right-to-left horizontal swipe row revealing a red delete action button.
 */
export default function SwipeToDeleteRow({
  children,
  onDelete,
  isOpen = false,
  onOpen,
  onSwipeStart,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const animateTo = (toValue) => {
    currentOffset.current = toValue;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 16,
    }).start();
  };

  useEffect(() => {
    if (!isOpen && currentOffset.current !== 0) {
      animateTo(0);
    }
  }, [isOpen]);

  const shouldCaptureHorizontal = (_, gesture) => {
    const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25;
    if (!isHorizontal) return false;
    if (currentOffset.current < 0) {
      return Math.abs(gesture.dx) > 8;
    }
    return gesture.dx < -8;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: shouldCaptureHorizontal,
      onMoveShouldSetPanResponderCapture: shouldCaptureHorizontal,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        onSwipeStart?.();
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.max(-ACTION_WIDTH, Math.min(0, currentOffset.current + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const start = currentOffset.current;

        if (start < 0) {
          if (gesture.vx > 0.3 || gesture.dx > ACTION_WIDTH * 0.4) {
            animateTo(0);
          } else {
            animateTo(-ACTION_WIDTH);
          }
          return;
        }

        if (gesture.vx < -0.35 || gesture.dx <= -(ACTION_WIDTH * 0.4)) {
          animateTo(-ACTION_WIDTH);
          onOpen?.();
        } else {
          animateTo(0);
        }
      },
      onPanResponderTerminate: () => {
        animateTo(currentOffset.current);
      },
    })
  ).current;

  const rightOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -8, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const handlePressDelete = () => {
    animateTo(0);
    onDelete?.();
  };

  return (
    <View style={styles.rowWrap}>
      <Animated.View
        style={[
          styles.actionContainer,
          styles.actionRight,
          { opacity: rightOpacity },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handlePressDelete}
          activeOpacity={0.8}
          accessibilityLabel="Delete item"
        >
          <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRight: {
    right: 0,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foreground: {
    backgroundColor: '#FFFFFF',
  },
});
