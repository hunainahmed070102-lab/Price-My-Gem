import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS = {
  error: 'close-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
};

/**
 * Provides an app-wide animated top toast notification overlay sized to its text.
 */
export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(-90)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -90,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message, type = 'error', duration = 2800) => {
      if (!message) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ message: String(message), type });
      translateY.setValue(-90);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 110,
          friction: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast, opacity, translateY]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const iconName = TOAST_ICONS[toast?.type] || TOAST_ICONS.error;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            {
              top: Math.max(insets.top, 10) + 8,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={hideToast}
            style={styles.card}
          >
            <Ionicons name={iconName} size={18} color={COLORS.primary} />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1E1742',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  message: {
    flexShrink: 1,
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
    color: COLORS.darkText,
    lineHeight: 18,
  },
});
