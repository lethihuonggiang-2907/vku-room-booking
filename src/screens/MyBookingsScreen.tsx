import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { Badge } from '../components/Badge';
import { formatDateVietnamese } from '../utils/dateUtils';
import { theme } from '../theme';

type MyBookingsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<MyBookingsNavProp>();
  const [filterTab, setFilterTab] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  const currentUser = useBookingStore((state) => state.currentUser);
  const bookings = useBookingStore((state) => state.bookings);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);

  // Lọc lịch đặt của người dùng hiện tại
  const myBookings = bookings.filter((b) => {
    // Có thể xem tất cả hoặc xem theo userId
    const isOwner = b.userId === currentUser.id;
    if (!isOwner) return false;
    if (filterTab === 'all') return true;
    return b.status === filterTab;
  });

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Xác nhận hủy đặt phòng',
      `Bạn có chắc chắn muốn hủy đặt ${booking.roomName} vào lúc ${booking.slotLabel} ngày ${formatDateVietnamese(booking.date)} không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt phòng',
          style: 'destructive',
          onPress: () => {
            const res = cancelBooking(booking.id);
            if (res.success) {
              Alert.alert('Thành công', 'Đã hủy đặt phòng thành công!');
            }
          },
        },
      ]
    );
  };

  const handleShowQRCode = (bookingId: string) => {
    navigation.navigate('QRCodeModal', { bookingId });
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

        {/* Card Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{formatDateVietnamese(item.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{item.slotLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailSubText} numberOfLines={1}>
              Mục đích: {item.purpose}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isConfirmed ? (
            <>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                <Text style={styles.cancelBtnText}>Hủy đặt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrBtn}
                onPress={() => handleShowQRCode(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={16} color={theme.colors.white} />
                <Text style={styles.qrBtnText}>Xem mã QR</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledBannerText}>Lượt đặt phòng này đã bị hủy</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch đặt của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý danh sách phòng học bạn đã đặt tại VKU
        </Text>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'all' && styles.tabItemActive]}
          onPress={() => setFilterTab('all')}
        >
          <Text style={[styles.tabText, filterTab === 'all' && styles.tabTextActive]}>
            Tất cả ({bookings.filter((b) => b.userId === currentUser.id).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'confirmed' && styles.tabItemActive]}
          onPress={() => setFilterTab('confirmed')}
        >
          <Text style={[styles.tabText, filterTab === 'confirmed' && styles.tabTextActive]}>
            Đã xác nhận (
            {bookings.filter((b) => b.userId === currentUser.id && b.status === 'confirmed').length}
            )
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'cancelled' && styles.tabItemActive]}
          onPress={() => setFilterTab('cancelled')}
        >
          <Text style={[styles.tabText, filterTab === 'cancelled' && styles.tabTextActive]}>
            Đã hủy (
            {bookings.filter((b) => b.userId === currentUser.id && b.status === 'cancelled').length}
            )
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={myBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={56} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có lịch đặt phòng nào</Text>
            <Text style={styles.emptySubtitle}>
              Khám phá danh sách các phòng học tại VKU và đặt phòng nhanh chóng.
            </Text>
          </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  tabText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  roomThumb: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  roomName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  bookingCodeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: 6,
  },
  detailSubText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: theme.spacing.xs,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    minHeight: 40,
  },
  cancelBtnText: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 4,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: 40,
    ...theme.shadows.sm,
  },
  qrBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 4,
  },
  cancelledBanner: {
    paddingVertical: 6,
    alignItems: 'center',
    width: '100%',
  },
  cancelledBannerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
