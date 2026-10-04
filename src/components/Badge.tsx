import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral' | 'buildingA' | 'buildingB' | 'buildingC' | 'buildingV';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
  textStyle,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.primaryLight, text: theme.colors.primary, border: '#BFDBFE' };
      case 'secondary':
        return { bg: theme.colors.secondaryLight, text: theme.colors.secondary, border: '#FED7AA' };
      case 'success':
        return { bg: theme.colors.successLight, text: theme.colors.successDark, border: '#A7F3D0' };
      case 'danger':
        return { bg: theme.colors.dangerLight, text: theme.colors.dangerDark, border: '#FECACA' };
      case 'warning':
        return { bg: theme.colors.warningLight, text: theme.colors.warning, border: '#FDE68A' };
      case 'buildingA':
        return theme.colors.buildingA;
      case 'buildingB':
        return theme.colors.buildingB;
      case 'buildingC':
        return theme.colors.buildingC;
      case 'buildingV':
        return theme.colors.buildingV;
      case 'neutral':
      default:
        return { bg: theme.colors.surfaceSubtle, text: theme.colors.textSecondary, border: theme.colors.border };
    }
  };

  const badgeColors = getBadgeColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 10,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: badgeColors.text,
            fontSize: isSmall ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
