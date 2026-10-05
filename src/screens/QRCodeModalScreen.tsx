import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { Badge } from '../components/Badge';
import { AppPressable } from '../components/AppPressable';
import { formatDateVietnamese } from '../utils/dateUtils';
import { theme } from '../theme';

type QRCodeModalRouteProp = RouteProp<RootStackParamList, 'QRCodeModal'>;

export const QRCodeModalScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<QRCodeModalRouteProp>();
  const { bookingId } = route.params;

  const bookings = useBookingStore((state) => state.bookings);
  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy thông tin đặt chỗ!</Text>
          <AppPressable
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            scaleTo={0.95}
          >
            <Text style={styles.closeButtonText}>Quay lại</Text>
          </AppPressable>
        </View>
      </SafeAreaView>
    );
  }

  // QR Payload: chứa mã check-in định dạng JSON
  const qrPayload = JSON.stringify({
    app: 'VKU-RoomBooking',
    code: booking.bookingCode,
    room: booking.roomCode,
    date: booking.date,
    slot: booking.slotId,
    user: booking.userCode,
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mã đặt phòng VKU: ${booking.bookingCode}\nPhòng: ${booking.roomName}\nThời gian: ${booking.slotLabel} - ${formatDateVietnamese(booking.date)}\nNgười đặt: ${booking.userName}`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const isConfirmed = booking.status === 'confirmed';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Close */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mã Check-in Phòng</Text>
          <AppPressable
            onPress={() => navigation.goBack()}
            style={styles.closeIconBtn}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="Đóng modal"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </AppPressable>
        </View>

        {/* QR Card with Reanimated Zoom & Slide */}
        <Animated.View
          entering={ZoomIn.duration(360).springify().damping(15)}
          style={styles.card}
        >
          {/* Animated Success Checkmark Badge (Hiệu ứng tích xanh khi đặt phòng thành công) */}
          {isConfirmed && (
            <Animated.View
              entering={ZoomIn.delay(180).duration(420).springify().damping(12)}
              style={styles.successCheckmarkWrapper}
            >
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={32} color={theme.colors.white} />
              </View>
              <Text style={styles.successHeading}>Đặt phòng thành công!</Text>
            </Animated.View>
          )}

          {/* Status Badge */}
          <View style={styles.badgeRow}>
            <Badge
              label={`Tòa ${booking.building}`}
              variant={`building${booking.building}` as any}
            />
            <Badge
              label={isConfirmed ? 'Đã xác nhận' : 'Đã hủy'}
              variant={isConfirmed ? 'success' : 'danger'}
            />
          </View>

          <Text style={styles.roomName}>{booking.roomName}</Text>
          <Text style={styles.bookingCodeLabel}>Mã đặt phòng:</Text>
          <Text style={styles.bookingCode}>{booking.bookingCode}</Text>

          {/* QR Code Container with subtle fade */}
          <Animated.View
            entering={FadeIn.delay(250).duration(300)}
            style={styles.qrContainer}
          >
            <QRCode
              value={qrPayload}
              size={180}
              color={theme.colors.text}
              backgroundColor={theme.colors.white}
            />
          </Animated.View>

          <Text style={styles.scanInstruction}>
            Xuất trình mã này cho Cán bộ quản lý phòng học hoặc quét tại cửa phòng để mở khóa
          </Text>

          {/* Information summary */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(320)}
            style={styles.summaryContainer}
          >
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Ngày:</Text>
              <Text style={styles.summaryValue}>{formatDateVietnamese(booking.date)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Khung giờ:</Text>
              <Text style={styles.summaryValue}>{booking.slotLabel}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Người đặt:</Text>
              <Text style={styles.summaryValue}>
                {booking.userName} ({booking.userCode})
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="people-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Số người:</Text>
              <Text style={styles.summaryValue}>{booking.attendeesCount} người</Text>
            </View>
          </Animated.View>

          {/* Share and Done Buttons */}
          <View style={styles.buttonRow}>
            <AppPressable
              style={styles.shareBtn}
              onPress={handleShare}
              scaleTo={0.95}
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ mã đặt phòng"
            >
              <Ionicons name="share-social-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.shareBtnText}>Chia sẻ</Text>
            </AppPressable>

            <AppPressable
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              scaleTo={0.95}
              accessibilityRole="button"
              accessibilityLabel="Hoàn tất"
            >
              <Text style={styles.doneBtnText}>Xong</Text>
            </AppPressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  successCheckmarkWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    marginBottom: 8,
  },
  successHeading: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.successDark,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  roomName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  bookingCodeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  bookingCode: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.heavy,
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.lg,
  },
  qrContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
    marginBottom: theme.spacing.md,
  },
  scanInstruction: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    width: 75,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.minTouchTarget,
  },
  shareBtnText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 6,
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.minTouchTarget,
    ...theme.shadows.sm,
  },
  doneBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.danger,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
