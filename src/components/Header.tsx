import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { NotificationBell } from './NotificationBell';
import { AppPressable } from './AppPressable';
import { formatDateVietnamese } from '../utils/dateUtils';
import { theme } from '../theme';

interface HeaderProps {
  user: User;
  selectedDate: string;
  onToggleUserRole: () => void;
  onOpenProfile?: () => void;
  unreadCount?: number;
  onPressNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedDate,
  onToggleUserRole,
  onOpenProfile,
  unreadCount = 0,
  onPressNotifications,
}) => {
  const isLecturer = user.role === 'Giảng viên';

  return (
    <View style={styles.header}>
      {/* Hàng 1: Logo và tên app ở bên trái, nút vai trò và chuông ở bên phải, căn giữa theo chiều dọc */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>VKU</Text>
          </View>
          <View>
            <Text style={styles.appName}>VKU Room Booking</Text>
            <Text style={styles.universitySubtitle}>
              Trường ĐH CNTT & TT Việt - Hàn
            </Text>
          </View>
        </View>

        {/* Nút vai trò và chuông thông báo */}
        <View style={styles.topRightActions}>
          <AppPressable
            style={styles.roleToggleButton}
            onPress={onToggleUserRole}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel={`Đổi vai trò. Hiện tại là ${user.role}`}
          >
            <Ionicons
              name={isLecturer ? 'school' : 'person'}
              size={15}
              color={theme.colors.primary}
            />
            <Text style={styles.roleToggleText}>
              {user.role} (Đổi)
            </Text>
          </AppPressable>

          {onPressNotifications && (
            <NotificationBell
              unreadCount={unreadCount}
              onPress={onPressNotifications}
            />
          )}
        </View>
      </View>

      {/* Hàng 2: Avatar và lời chào bên trái, nhãn ngày bên phải */}
      <View style={styles.bottomRow}>
        <AppPressable
          style={styles.userInfo}
          onPress={onOpenProfile}
          scaleTo={0.97}
          accessibilityRole="button"
          accessibilityLabel={`Hồ sơ người dùng ${user.name}`}
        >
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userTextContainer}>
            <Text style={styles.greetingText}>Xin chào,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
          </View>
        </AppPressable>

        <View style={styles.dateBadgeContainer}>
          <Ionicons name="calendar" size={13} color={theme.colors.secondary} />
          <Text style={styles.dateBadgeText}>
            {formatDateVietnamese(selectedDate)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: theme.spacing.sm,
  },
  logoBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  logoBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.heavy,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  universitySubtitle: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minHeight: 38,
  },
  roleToggleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  userTextContainer: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  greetingText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  dateBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexShrink: 0,
  },
  dateBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
});
