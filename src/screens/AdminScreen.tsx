import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDateVietnamese } from '../utils/dateUtils';
import { cancelBookingReminder } from '../utils/notificationService';
import { getRoleLabel } from '../constants/authConstants';
import { theme } from '../theme';

export const AdminScreen: React.FC = () => {
  const [filterTab, setFilterTab] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { notifyBookingCancelled } = useNotifications();
  const bookings = useBookingStore((state) => state.bookings);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);

  // Thống kê nhanh toàn trường
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  // Lọc danh sách lượt đặt của toàn bộ người dùng
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Lọc theo trạng thái
      if (filterTab !== 'all' && b.status !== filterTab) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (tên người đặt, mã người đặt, tên phòng, mã đặt)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = b.userName.toLowerCase().includes(query);
        const matchCode = b.userCode.toLowerCase().includes(query);
        const matchRoom = b.roomName.toLowerCase().includes(query);
        const matchBookingCode = b.bookingCode.toLowerCase().includes(query);
        const matchPurpose = b.purpose.toLowerCase().includes(query);

        if (!matchName && !matchCode && !matchRoom && !matchBookingCode && !matchPurpose) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filterTab, searchQuery]);

  // Quản trị viên hủy lượt đặt phòng của người dùng (có hộp thoại xác nhận)
  const handleAdminCancelBooking = (booking: Booking) => {
    const confirmMessage = `Bạn có chắc chắn muốn hủy lượt đặt ${booking.bookingCode} của ${booking.userName} (${getRoleLabel(booking.userRole)}) cho phòng ${booking.roomName} không?`;

    const executeCancel = async () => {
      if (booking.notificationId) {
        await cancelBookingReminder(booking.notificationId);
      }
      const res = cancelBooking(booking.id);
      if (res.success) {
        notifyBookingCancelled(booking);
        if (Platform.OS === 'web') {
          alert('Đã hủy lịch đặt phòng thành công!');
        } else {
          Alert.alert('Thành công', 'Đã hủy lịch đặt phòng của người dùng thành công!');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        executeCancel();
      }
    } else {
      Alert.alert(
        'Xác nhận hủy lịch đặt của người dùng',
        confirmMessage,
        [
          { text: 'Bỏ qua', style: 'cancel' },
          {
            text: 'Xác nhận hủy',
            style: 'destructive',
            onPress: executeCancel,
          },
        ]
      );
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isConfirmed = item.status === 'confirmed';

    return (
      <View style={styles.bookingCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.roomImage }} style={styles.roomThumb} />
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <Badge
                label={`Tòa ${item.building}`}
                variant={`building${item.building}` as any}
                size="sm"
              />
              <Badge
                label={isConfirmed ? 'Đã xác nhận' : 'Đã hủy'}
                variant={isConfirmed ? 'success' : 'danger'}
                size="sm"
              />
            </View>
            <Text style={styles.roomName} numberOfLines={1}>
              {item.roomName}
            </Text>
            <Text style={styles.bookingCodeText}>Mã đặt: {item.bookingCode}</Text>
          </View>
        </View>

        {/* Card Body: Thông tin thời gian và người đặt */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Ngày: <Text style={styles.infoTextBold}>{formatDateVietnamese(item.date)}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.secondary} />
            <Text style={styles.infoText}>
              Khung giờ: <Text style={styles.infoTextBold}>{item.slotLabel}</Text>
            </Text>
          </View>

          {/* Hộp thông tin người đặt dành cho Quản trị viên */}
          <View style={styles.userBannerBox}>
            <View style={styles.userAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.userBannerDetails}>
              <View style={styles.userNameRoleRow}>
                <Text style={styles.userNameText}>{item.userName}</Text>
                <Badge
                  label={getRoleLabel(item.userRole)}
                  variant={item.userRole === 'lecturer' ? 'warning' : 'primary'}
                  size="sm"
                />
              </View>
              <Text style={styles.userCodeText}>Mã định danh: {item.userCode}</Text>
              <Text style={styles.purposeText} numberOfLines={1}>
                Mục đích: {item.purpose}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Actions: Quản trị viên có nút Hủy lượt đặt */}
        {isConfirmed && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => handleAdminCancelBooking(item)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Hủy lượt đặt phòng của ${item.userName}`}
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.colors.dangerDark} />
              <Text style={styles.cancelActionBtnText}>Hủy lượt đặt này (Admin)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Quản lý */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Quản lý Lịch Đặt</Text>
            <Text style={styles.headerSubtitle}>
              Bảng điều khiển phân quyền Quản trị viên VKU
            </Text>
          </View>
          <View style={styles.adminBadgeWrap}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.white} />
            <Text style={styles.adminBadgeText}>QTV</Text>
          </View>
        </View>

        {/* Thống kê nhanh toàn hệ thống */}
        <View style={styles.statsOverviewRow}>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewNumber}>{totalCount}</Text>
            <Text style={styles.overviewLabel}>Toàn trường</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBox}>
            <Text style={[styles.overviewNumber, { color: theme.colors.successDark }]}>
              {confirmedCount}
            </Text>
            <Text style={styles.overviewLabel}>Hoạt động</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBox}>
            <Text style={[styles.overviewNumber, { color: theme.colors.danger }]}>
              {cancelledCount}
            </Text>
            <Text style={styles.overviewLabel}>Đã hủy</Text>
          </View>
        </View>

        {/* Ô tìm kiếm nhanh */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên người đặt, MSSV, phòng, mã đặt..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Thanh lọc trạng thái */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'all' && styles.filterTabActive]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'all' && styles.filterTabTextActive,
              ]}
            >
              Tất cả ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'confirmed' && styles.filterTabActive]}
            onPress={() => setFilterTab('confirmed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'confirmed' && styles.filterTabTextActive,
              ]}
            >
              Đang đặt ({confirmedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'cancelled' && styles.filterTabActive]}
            onPress={() => setFilterTab('cancelled')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'cancelled' && styles.filterTabTextActive,
              ]}
            >
              Đã hủy ({cancelledCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách lượt đặt */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Không tìm thấy lượt đặt nào"
            description={
              searchQuery
                ? 'Không có lượt đặt nào khớp với từ khóa tìm kiếm.'
                : 'Hiện chưa có lượt đặt phòng học nào trên hệ thống.'
            }
            iconName="calendar-outline"
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  adminBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerDark,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  adminBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statsOverviewRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
  },
  overviewBox: {
    flex: 1,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.heavy,
    color: theme.colors.text,
  },
  overviewLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    paddingVertical: 8,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    minHeight: 38,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
  },
  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: 12,
  },
  roomThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.sm,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  roomName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  bookingCodeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cardBody: {
    padding: theme.spacing.md,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  infoTextBold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  userBannerBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginTop: 4,
    gap: 10,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBannerDetails: {
    flex: 1,
  },
  userNameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  userCodeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  purposeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: '#FFF7F7',
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  cancelActionBtnText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.dangerDark,
  },
});
