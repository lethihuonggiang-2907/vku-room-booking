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
import { getRoleLabel } from '../constants/authConstants';
import { theme } from '../theme';

interface HeaderProps {
  user: User;
  selectedDate: string;
  onToggleUserRole?: () => void;
  onOpenProfile?: () => void;
  unreadCount?: number;
  onPressNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedDate,
  onOpenProfile,
  unreadCount = 0,
  onPressNotifications,
}) => {
  const isLecturer = user.role === 'lecturer';
  const isAdmin = user.role === 'admin';
  const roleLabel = getRoleLabel(user.role);

  return (
    <View style={styles.header}>
      {/* Hàng 1: Logo và tên app ở bên trái, nhãn vai trò và chuông ở bên phải, căn giữa theo chiều dọc */}
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

        {/* Nhãn vai trò của người đang đăng nhập và chuông thông báo */}
        <View style={styles.topRightActions}>
          <View
            style={[
              styles.roleBadgeDisplay,
              isAdmin
                ? styles.roleBadgeAdmin
                : isLecturer
                ? styles.roleBadgeLecturer
                : styles.roleBadgeStudent,
            ]}
          >
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : isLecturer ? 'school' : 'person'}
              size={13}
              color={
                isAdmin
                  ? theme.colors.dangerDark
                  : isLecturer
                  ? '#B45309'
                  : theme.colors.primary
              }
            />
            <Text
              style={[
                styles.roleBadgeDisplayText,
                isAdmin
                  ? styles.roleBadgeTextAdmin
                  : isLecturer
                  ? styles.roleBadgeTextLecturer
                  : styles.roleBadgeTextStudent,
              ]}
            >
              {roleLabel}
            </Text>
          </View>

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
  roleBadgeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    minHeight: 34,
  },
  roleBadgeStudent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  roleBadgeLecturer: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  roleBadgeAdmin: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  roleBadgeDisplayText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: 5,
  },
  roleBadgeTextStudent: {
    color: theme.colors.primary,
  },
  roleBadgeTextLecturer: {
    color: '#92400E',
  },
  roleBadgeTextAdmin: {
    color: theme.colors.dangerDark,
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
