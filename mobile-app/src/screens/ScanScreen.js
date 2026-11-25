
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { analysisService } from '../services/api';
import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function ScanScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    'ANALYZING GEMSTONE WITH AI...'
  );
  const [previewUri, setPreviewUri] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Release inline camera cleanly if user switches tabs
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setCameraActive(false);
      setCameraReady(false);
    });
    return unsubscribe;
  }, [navigation]);

  // Scanning beam animation
  useEffect(() => {
    if (loading) {
      const scan = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      scan.start();
      return () => scan.stop();
    }

    scanLineAnim.setValue(0);
  }, [loading, scanLineAnim]);

  // Process gemstone image
  const processImageAnalysis = async (imageUri) => {
    try {
      setPreviewUri(imageUri);
      setLoading(true);
      setLoadingMessage('IDENTIFYING GEMSTONE WITH NEURAL MODEL...');

      const response = await analysisService.analyzeImage(imageUri);

      setLoading(false);

      if (response && response.success && response.data) {
        navigation.navigate('Result', {
          result: response.data,
          imageUri,
        });
        setTimeout(() => setPreviewUri(null), 300);
      } else {
        setPreviewUri(null);

        Alert.alert(
          'Not a Gemstone',
          'Scan a valid gemstone.',
          [{ text: 'Try Again', style: 'cancel' }]
        );
      }
    } catch (error) {
      setLoading(false);
      setPreviewUri(null);

      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        '';

      if (
        error.response?.status === 422 ||
        serverMessage.toLowerCase().includes('not a gemstone')
      ) {
        Alert.alert(
          'Not a Gemstone',
          'Please scan a valid gemstone.',
          [{ text: 'Scan Again' }]
        );
      } else {
        Alert.alert(
          'Scan Failed',
          serverMessage || 'Unable to connect to AI service.',
          [{ text: 'OK', style: 'cancel' }]
        );
      }
    }
  };

  // Open inline camera inside Scan Gemstone box, or capture & scan if already active
  const handleScanPress = async () => {
    if (cameraActive) {
      await handleCapturePhoto();
      return;
    }

    try {
      const perm = await Camera.requestCameraPermissionsAsync();

      if (perm.status !== 'granted') {
        if (perm.canAskAgain === false) {
          Alert.alert(
            'Camera Permission',
            'Enable camera access in device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert('Permission Required', 'Allow camera access to scan.');
        }
        return;
      }

      setPreviewUri(null);
      setCameraReady(false);
      setCapturing(false);
      setCameraActive(true);
    } catch (error) {
      console.error('Camera permission error:', error);
      handleCameraMountError();
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      setCameraActive(false);
      if (photo?.uri) {
        await processImageAnalysis(photo.uri);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setCameraActive(false);
      Alert.alert('Camera Error', 'Could not capture photo.');
    } finally {
      setCapturing(false);
    }
  };

  const handleCameraMountError = async () => {
    setCameraActive(false);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        await processImageAnalysis(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Camera mount fallback error:', err);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Gallery upload
  const handleUploadPress = async () => {
    setCameraActive(false);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Allow photo library access.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await processImageAnalysis(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery launch error:', error);
      Alert.alert('Gallery Error', 'Could not open gallery.');
    }
  };

  const scanTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 44],
  });

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Scan Gemstone
        </Text>

        <Text style={styles.headerSubtitle}>
          Identify your gemstone and discover its estimated market value
        </Text>
      </View>

      {/* Scanner */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinderReticle}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
            />
          ) : cameraActive ? (
            <CameraView
              ref={cameraRef}
              style={styles.previewImage}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
              onMountError={handleCameraMountError}
            />
          ) : (
            <View style={styles.reticlePlaceholder}>

              {/* Main Heading - Scanner Icon Removed */}
              <Text style={styles.reticleHintText}>
                SCAN YOUR GEMSTONE
              </Text>

              {/* Instructions */}
              <Text style={styles.reticleSubText}>
                Position your gemstone inside the frame
                {'\n'}
                for accurate AI identification
              </Text>

            </View>
          )}

          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scanning Beam & Inline Loading State Inside Camera Box */}
          {loading && (
            <>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      { translateY: scanTranslateY },
                    ],
                  },
                ]}
              />
              <View style={styles.boxLoadingOverlay}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                  />

                  <Text style={styles.loadingTitle}>
                    {loadingMessage}
                  </Text>

                  <Text style={styles.loadingSubtitle}>
                    Classifying 88 gemstone varieties and checking authenticity
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Scanning Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Use good lighting and a clear gemstone image for better identification
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (loading || capturing) && styles.disabledButton,
          ]}
          onPress={handleScanPress}
          disabled={loading || capturing}
          activeOpacity={0.85}
        >
          {capturing ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.primaryButtonText}>
              {cameraActive ? 'Capture & Scan' : 'Take Photo & Scan'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            loading && styles.disabledSecondaryButton,
          ]}
          onPress={handleUploadPress}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>
            Choose From Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  headerTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    color: COLORS.darkText || COLORS.textPrimary,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 5,
  },

  headerSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Scanner Container
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },

  // Square Scanner
  viewfinderReticle: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Scanner Placeholder
  reticlePlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },

  reticleHintText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
    color: COLORS.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },

  reticleSubText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Corner Brackets
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: COLORS.primary,
  },

  cornerTL: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 5,
  },

  cornerTR: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 5,
  },

  cornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 5,
  },

  cornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 5,
  },

  // Scanning Beam
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },

  // Tip
  tipCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 14,
    maxWidth: width * 0.88,
  },

  tipText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 10,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    height: 49,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },

  primaryButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    height: 49,
    borderRadius: 30,
  },

  secondaryButtonText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },

  disabledButton: {
    opacity: 0.7,
  },

  disabledSecondaryButton: {
    opacity: 0.5,
  },

  // Inline Loading inside Viewfinder Box
  boxLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 23, 66, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    zIndex: 10,
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '86%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    gap: 8,
  },

  loadingTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  loadingSubtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
