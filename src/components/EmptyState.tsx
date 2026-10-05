import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppPressable } from './AppPressable';
import { theme } from '../theme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy phòng phù hợp',
  description = 'Vui lòng thử tìm kiếm bằng từ khóa khác hoặc điều chỉnh lại các điều kiện lọc.',
  actionText,
  iconName = 'search-outline',
  iconColor = theme.colors.primary,
  actionIcon = 'refresh-outline',
  onAction,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).springify()}
      style={styles.container}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={iconName} size={36} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onAction && actionText && (
        <AppPressable
          style={styles.actionButton}
          onPress={onAction}
          scaleTo={0.95}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Ionicons name={actionIcon} size={16} color={theme.colors.white} />
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </AppPressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
    maxWidth: 320,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.minTouchTarget,
    ...theme.shadows.md,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 6,
  },
});
