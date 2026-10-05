import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { Badge } from './Badge';
import { NotificationBell } from './NotificationBell';
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
      {/* Top Row: VKU Brand & Switch Role Button */}
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

        {/* Quick Role Toggle Button for Pairing/Testing */}
        <TouchableOpacity
          style={styles.roleToggleButton}
          onPress={onToggleUserRole}
          activeOpacity={0.8}
          accessibilityLabel={`Đổi vai trò. Hiện tại là ${user.role}`}
        >
          <Ionicons
            name={isLecturer ? 'school' : 'person'}
            size={14}
            color={theme.colors.primary}
          />
          <Text style={styles.roleToggleText}>
            {user.role} (Đổi)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Greeting, Notification Bell and Selected Date Banner */}
      <View style={styles.bottomRow}>
        <View style={styles.userSection}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={onOpenProfile}
            activeOpacity={0.7}
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.userTextContainer}>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Chuông thông báo (đặt cạnh thông tin người dùng) */}
          {onPressNotifications && (
            <NotificationBell
              unreadCount={unreadCount}
              onPress={onPressNotifications}
            />
          )}
        </View>

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
  roleToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minHeight: 34,
  },
  roleToggleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.xs,
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
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  dateBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
});
