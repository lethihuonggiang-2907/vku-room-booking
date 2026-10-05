import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onPress,
}) => {
  const prevCount = useRef(unreadCount);

  // Giá trị animation từ react-native-reanimated
  const bellRotation = useSharedValue(0);
  const badgeScale = useSharedValue(unreadCount > 0 ? 1 : 0);

  useEffect(() => {
    // Nếu có thông báo mới tăng lên -> lắc chuông nhẹ & nảy badge
    if (unreadCount > prevCount.current) {
      bellRotation.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );

      badgeScale.value = withSequence(
        withTiming(1.3, { duration: 140 }),
        withSpring(1, { damping: 9, stiffness: 180 })
      );
    } else if (unreadCount === 0) {
      badgeScale.value = withTiming(0, { duration: 120 });
    } else {
      badgeScale.value = withSpring(1);
    }

    prevCount.current = unreadCount;
  }, [unreadCount, bellRotation, badgeScale]);

  const animatedBellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.value}deg` }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value === 0 ? 0 : 1,
  }));

  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();

  return (
    <TouchableOpacity
      style={styles.touchTarget}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Hộp thông báo, ${unreadCount} thông báo chưa đọc`}
    >
      <Animated.View style={[styles.bellContainer, animatedBellStyle]}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={20}
          color={theme.colors.primary}
        />
      </Animated.View>

      {unreadCount > 0 && (
        <Animated.View style={[styles.badge, animatedBadgeStyle]}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    ...theme.shadows.sm,
  },
  bellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
