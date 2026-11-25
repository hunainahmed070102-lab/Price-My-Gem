import React, { useState, useEffect, useMemo } from 'react';
import { Image } from 'react-native';
import { API_BASE_URL } from '../constants/config';

const BASE_HOST = API_BASE_URL.replace(/\/api\/?$/, '');

const GEM_FALLBACKS = {
  ruby: require('../../assets/ruby.webp'),
  sapphire: require('../../assets/sapphire.webp'),
  emerald: require('../../assets/emerald.webp'),
  diamond: require('../../assets/diamond.webp'),
  amethyst: require('../../assets/amethyst.webp'),
  topaz: require('../../assets/topaz.webp'),
  citrine: require('../../assets/citrine.webp'),
  pearl: require('../../assets/pearl.webp'),
};

const getFallbackAsset = (gemstoneType = '') => {
  const lower = String(gemstoneType || '').toLowerCase();
  for (const key of Object.keys(GEM_FALLBACKS)) {
    if (lower.includes(key)) {
      return GEM_FALLBACKS[key];
    }
  }
  return GEM_FALLBACKS.diamond;
};

/**
 * Resolves a local device URI, relative `/uploads/...` path, or full HTTP URL
 * into a React Native Image source pointing at the active backend host.
 */
export const resolveScanImageUri = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;

  if (typeof raw === 'object' && raw.uri) {
    return resolveScanImageUri(raw.uri);
  }

  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^(file|content|ph|assets-library|data):/i.test(trimmed)) {
    return { uri: trimmed };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const rewritten = trimmed.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?/i,
      BASE_HOST
    );
    return { uri: rewritten };
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const pathWithSlash = normalized.startsWith('/')
    ? normalized
    : normalized.startsWith('uploads/')
      ? `/${normalized}`
      : `/uploads/${normalized}`;

  return { uri: `${BASE_HOST}${pathWithSlash}` };
};

/**
 * Renders the user's real scanned/uploaded photo first and only falls back to a
 * gemstone placeholder asset if the remote file fails to load.
 */
export default function GemImage({
  localUri,
  imageUrl,
  gemstoneType,
  style,
  resizeMode = 'cover',
}) {
  const sources = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addSource = (src) => {
      if (!src) return;
      const key = typeof src === 'object' ? src.uri : String(src);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push(src);
    };

    addSource(resolveScanImageUri(localUri));
    addSource(resolveScanImageUri(imageUrl));
    addSource(getFallbackAsset(gemstoneType));

    return list;
  }, [localUri, imageUrl, gemstoneType]);

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [localUri, imageUrl, gemstoneType]);

  const currentSource = sources[sourceIndex] || getFallbackAsset(gemstoneType);

  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    }
  };

  return (
    <Image
      source={currentSource}
      style={style}
      resizeMode={resizeMode}
      onError={handleError}
    />
  );
}
