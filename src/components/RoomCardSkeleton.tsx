import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

export const RoomCardSkeleton: React.FC = () => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 800 }),
        withTiming(0.35, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, animatedStyle]} />

      <View style={styles.body}>
        {/* Title & Badge */}
        <View style={styles.headerRow}>
          <Animated.View style={[styles.titleSkeleton, animatedStyle]} />
          <Animated.View style={[styles.badgeSkeleton, animatedStyle]} />
        </View>

        {/* Subtitle / Code */}
        <Animated.View style={[styles.subTitleSkeleton, animatedStyle]} />

        {/* Description line 1 & 2 */}
        <Animated.View style={[styles.descLineLong, animatedStyle]} />
        <Animated.View style={[styles.descLineShort, animatedStyle]} />

        {/* Equipment Chips */}
        <View style={styles.chipsRow}>
          <Animated.View style={[styles.chipSkeleton, animatedStyle]} />
          <Animated.View style={[styles.chipSkeleton, animatedStyle]} />
          <Animated.View style={[styles.chipSkeleton, animatedStyle]} />
        </View>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footerRow}>
          <Animated.View style={[styles.ratingSkeleton, animatedStyle]} />
          <Animated.View style={[styles.buttonSkeleton, animatedStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  imageSkeleton: {
    width: '100%',
    height: 165,
    backgroundColor: '#E2E8F0',
  },
  body: {
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSkeleton: {
    width: '55%',
    height: 20,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  badgeSkeleton: {
    width: 68,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
  },
  subTitleSkeleton: {
    width: '30%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  descLineLong: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  descLineShort: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chipSkeleton: {
    width: 78,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingSkeleton: {
    width: 50,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  buttonSkeleton: {
    width: 135,
    height: 42,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#E2E8F0',
  },
});
