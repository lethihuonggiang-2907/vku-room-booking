import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AppNotification, AppNotificationType } from '../types';
import { useNotifications, formatRelativeTime } from '../hooks/useNotifications';
import { useBookingStore } from '../store/useBookingStore';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme';

type NotificationsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsNavProp>();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    syncCheckinReminders,
  } = useNotifications();

  const bookings = useBookingStore((state) => state.bookings);

  // Khi mở màn hình thông báo, tự động đồng bộ các nhắc nhở check-in chưa tạo
  useEffect(() => {
    syncCheckinReminders(bookings);
  }, [bookings, syncCheckinReminders]);

  // Xử lý khi nhấn vào một mục thông báo
  const handlePressItem = useCallback(
    (item: AppNotification) => {
      // 1. Đánh dấu đã đọc
      if (!item.isRead) {
        markAsRead(item.id);
      }

      // 2. Điều hướng tương ứng nếu có bookingId
      if (item.bookingId) {
        const targetBooking = bookings.find((b) => b.id === item.bookingId);
        if (targetBooking && targetBooking.status === 'confirmed') {
          navigation.navigate('QRCodeModal', { bookingId: item.bookingId });
        } else {
          // Nếu booking đã hủy hoặc xem lịch, chuyển đến Lịch của tôi
          navigation.navigate('MainTabs');
        }
      }
    },
    [bookings, markAsRead, navigation]
  );

  // Xóa tất cả có xác nhận
  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Xóa toàn bộ thông báo',
      'Bạn có chắc chắn muốn xóa tất cả thông báo trong hộp thư không? Thao tác này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ]
    );
  }, [clearAll, notifications.length]);

  // Cấu hình icon và màu sắc theo loại thông báo
  const getTypeConfig = (type: AppNotificationType) => {
    switch (type) {
      case 'booking_confirmed':
        return {
          icon: 'checkmark-circle' as const,
          color: theme.colors.success,
          bg: '#ECFDF5',
          label: 'Đặt thành công',
        };
      case 'booking_cancelled':
        return {
          icon: 'close-circle' as const,
          color: theme.colors.danger,
          bg: '#FEF2F2',
          label: 'Đã hủy đặt',
        };
      case 'checkin_reminder':
        return {
          icon: 'alarm' as const,
          color: '#F59E0B',
          bg: '#FFFBEB',
          label: 'Nhắc check-in',
        };
      case 'demo':
      default:
        return {
          icon: 'notifications' as const,
          color: '#7C3AED',
          bg: '#F5F3FF',
          label: 'Hệ thống / Demo',
        };
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const typeConfig = getTypeConfig(item.type);

      return (
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !item.isRead && styles.notificationItemUnread,
          ]}
          onPress={() => handlePressItem(item)}
          activeOpacity={0.7}
        >
          {/* Icon loại thông báo */}
          <View style={[styles.iconCircle, { backgroundColor: typeConfig.bg }]}>
            <Ionicons name={typeConfig.icon} size={22} color={typeConfig.color} />
          </View>

          {/* Nội dung thông báo */}
          <View style={styles.contentWrap}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.itemTitle,
                  !item.isRead && styles.itemTitleUnread,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.itemContent} numberOfLines={3}>
              {item.content}
            </Text>

            <View style={styles.footerRow}>
              <Text style={styles.relativeTimeText}>
                {formatRelativeTime(item.createdAt)}
              </Text>

              {item.bookingId && (
                <View style={styles.actionHint}>
                  <Text style={styles.actionHintText}>Xem chi tiết</Text>
                  <Ionicons name="chevron-forward" size={12} color={theme.colors.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Nút xóa 1 mục */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteNotification(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Xóa thông báo này"
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [deleteNotification, handlePressItem]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* Header điều hướng */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Hộp thông báo</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} mới</Text>
              </View>
            )}
          </View>
        </View>

        {/* Nút hành động nhanh */}
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={16} color={theme.colors.primary} />
              <Text style={styles.headerActionText}>Đọc tất cả</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
              <Text style={[styles.headerActionText, { color: theme.colors.danger }]}>
                Xóa hết
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách thông báo (FlatList) */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có thông báo nào"
            description="Các thông báo xác nhận đặt phòng, nhắc nhở check-in và thông tin hệ thống VKU sẽ hiển thị tại đây."
            actionText="Quay về Trang chủ"
            onAction={() => navigation.goBack()}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    marginRight: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  headerActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
    ...theme.shadows.sm,
  },
  notificationItemUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
    marginRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 6,
  },
  itemContent: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relativeTimeText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionHintText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: 2,
  },
  deleteBtn: {
    padding: 4,
  },
});
