import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { RootStackParamList, TimeSlotId, TimeSlot } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { TIME_SLOTS } from '../data/timeSlots';
import { getNext7Days, formatDateVietnamese, isSlotPassed } from '../utils/dateUtils';
import { scheduleBookingReminder, cancelBookingReminder } from '../utils/notificationService';
import { createBookingApi } from '../api/roomApi';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

type RoomDetailRouteProp = RouteProp<RootStackParamList, 'RoomDetail'>;
type RoomDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

export const RoomDetailScreen: React.FC = () => {
  const navigation = useNavigation<RoomDetailNavProp>();
  const route = useRoute<RoomDetailRouteProp>();
  const { roomId } = route.params;

  const rooms = useBookingStore((state) => state.rooms);
  const currentUser = useBookingStore((state) => state.currentUser);
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);
  const addBooking = useBookingStore((state) => state.addBooking);
  const initialDate = useBookingStore((state) => state.filters.selectedDate);
  const setSelectedDateStore = useBookingStore((state) => state.setSelectedDate);

  const room = rooms.find((r) => r.id === roomId);

  const next7Days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || next7Days[0].date);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [purpose, setPurpose] = useState<string>('');
  const [attendees, setAttendees] = useState<number>(2);

  // TanStack Query: useMutation cho thao tác đặt phòng giả lập backend
  const bookingMutation = useMutation({
    mutationFn: createBookingApi,
  });

  if (!room) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Không tìm thấy thông tin phòng học</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getEquipmentIcon = (eq: string) => {
    switch (eq) {
      case 'Máy chiếu':
        return 'videocam-outline';
      case 'Bảng trắng':
        return 'easel-outline';
      case 'Máy tính cấu hình cao':
        return 'desktop-outline';
      case 'Điều hòa':
        return 'snow-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Chưa chọn khung giờ', 'Vui lòng chọn một khung giờ còn trống để đặt phòng.');
      return;
    }

    try {
      // 1. Gọi API đặt phòng giả lập Backend qua TanStack Query useMutation
      const apiResponse = await bookingMutation.mutateAsync({
        roomId: room.id,
        date: selectedDate,
        slotId: selectedSlot.id,
        slotLabel: selectedSlot.label,
        purpose: purpose.trim() || (currentUser.role === 'Giảng viên' ? 'Giảng dạy & Cố vấn' : 'Học tập & Thảo luận nhóm'),
        attendeesCount: attendees,
        userId: currentUser.id,
        userName: currentUser.name,
        userCode: currentUser.code,
        userRole: currentUser.role,
      });

      if (!apiResponse.success || !apiResponse.data) {
        Alert.alert('Lỗi đặt phòng', apiResponse.message || 'Không thể tạo lượt đặt phòng!');
        return;
      }

      // 2. Lên lịch thông báo nhắc nhở 15 phút trước giờ nhận phòng
      const notificationId = await scheduleBookingReminder({
        id: apiResponse.data.bookingId,
        roomName: room.name,
        roomCode: room.roomCode,
        date: selectedDate,
        slotLabel: selectedSlot.label,
        slotId: selectedSlot.id,
      });

      // 3. Cập nhật ATOMIC vào Zustand Store để lưu client-state bền vững (AsyncStorage)
      const result = addBooking({
        roomId: room.id,
        date: selectedDate,
        slotId: selectedSlot.id,
        slotLabel: selectedSlot.label,
        purpose: purpose.trim() || (currentUser.role === 'Giảng viên' ? 'Giảng dạy & Cố vấn' : 'Học tập & Thảo luận nhóm'),
        attendeesCount: attendees,
        notificationId,
      });

      if (!result.success || !result.booking) {
        // Hủy thông báo nếu đặt phòng thất bại do xung đột
        if (notificationId) {
          await cancelBookingReminder(notificationId);
        }
        Alert.alert('Xung đột lịch đặt', result.error || 'Đã có lỗi xảy ra khi đặt phòng!');
        return;
      }

      // 4. Mở màn hình QR Code Check-in
      navigation.navigate('QRCodeModal', { bookingId: result.booking.id });
    } catch (error: any) {
      Alert.alert('Lỗi máy chủ', error?.message || 'Không thể kết nối đến máy chủ đặt phòng!');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: room.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          {/* Floating Back Button */}
          <SafeAreaView edges={['top']} style={styles.floatingHeader}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Bottom Hero Badges */}
          <View style={styles.floatingBadges}>
            <Badge
              label={`Tòa ${room.building} - Tầng ${room.floor}`}
              variant={`building${room.building}` as any}
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{room.rating ?? '5.0'}</Text>
            </View>
          </View>
        </View>

        {/* Room Header Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomType}>{room.type} • Mã: {room.roomCode}</Text>

          <View style={styles.capacityRow}>
            <Ionicons name="people" size={16} color={theme.colors.primary} />
            <Text style={styles.capacityText}>Sức chứa tối đa: {room.capacity} người</Text>
          </View>

          <Text style={styles.description}>{room.description}</Text>

          {/* Equipment List */}
          <Text style={styles.subSectionTitle}>Trang thiết bị phòng học</Text>
          <View style={styles.equipmentGrid}>
            {room.equipment.map((eq) => (
              <View key={eq} style={styles.equipmentCard}>
                <Ionicons
                  name={getEquipmentIcon(eq) as any}
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.equipmentName}>{eq}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Step 1: Chọn ngày */}
        <View style={styles.bookingSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn ngày sử dụng (7 ngày tới)</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
          >
            {next7Days.map((d) => {
              const isSelected = selectedDate === d.date;
              return (
                <TouchableOpacity
                  key={d.date}
                  style={[
                    styles.dateItem,
                    isSelected && styles.dateItemSelected,
                    d.isToday && styles.dateItemToday,
                  ]}
                  onPress={() => {
                    setSelectedDate(d.date);
                    setSelectedDateStore(d.date);
                    setSelectedSlot(null); // Reset slot khi đổi ngày
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateDayOfWeek,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {d.dayOfWeek}
                  </Text>
                  <Text
                    style={[
                      styles.dateDayNumber,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {d.dayNumber}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    Th{d.monthNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.selectedDateLabel}>
            Ngày đã chọn: <Text style={styles.selectedDateBold}>{formatDateVietnamese(selectedDate)}</Text>
          </Text>
        </View>

        {/* Step 2: Chọn khung giờ (Disabled nếu đã đặt hoặc đã qua) */}
        <View style={styles.bookingSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn khung giờ cố định</Text>
          </View>

          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const booked = isSlotBooked(room.id, selectedDate, slot.id);
              const passed = isSlotPassed(selectedDate, slot.startTime);
              const isDisabled = booked || passed;
              const isSelected = selectedSlot?.id === slot.id;

              let statusText = 'Còn trống';
              if (booked) statusText = 'Đã có người đặt';
              else if (passed) statusText = 'Đã qua giờ';

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    isDisabled && styles.slotCardDisabled,
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => {
                    if (!isDisabled) setSelectedSlot(slot);
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.8}
                >
                  <View style={styles.slotTopRow}>
                    <Text
                      style={[
                        styles.slotPeriod,
                        isDisabled && styles.textDisabled,
                        isSelected && styles.textSelected,
                      ]}
                    >
                      {slot.period}
                    </Text>
                    <View
                      style={[
                        styles.slotDot,
                        {
                          backgroundColor: isDisabled
                            ? theme.colors.textMuted
                            : isSelected
                            ? theme.colors.white
                            : theme.colors.success,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.slotLabel,
                      isDisabled && styles.textDisabled,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {slot.label}
                  </Text>

                  <Text
                    style={[
                      styles.slotStatus,
                      {
                        color: isDisabled
                          ? theme.colors.danger
                          : isSelected
                          ? theme.colors.white
                          : theme.colors.successDark,
                      },
                    ]}
                  >
                    {statusText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 3: Thông tin bổ sung */}
        <View style={styles.bookingSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Thông tin đặt phòng</Text>
          </View>

          {/* User Role Banner */}
          <View style={styles.userInfoBanner}>
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
            <View style={styles.userInfoTextWrap}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userRoleSubtitle}>
                {currentUser.role} • Mã: {currentUser.code}
              </Text>
            </View>
          </View>

          {/* Attendees Counter */}
          <View style={styles.attendeesContainer}>
            <View>
              <Text style={styles.fieldLabel}>Số người tham gia</Text>
              <Text style={styles.fieldHint}>Tối đa: {room.capacity} người</Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAttendees((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="remove" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{attendees}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAttendees((prev) => Math.min(room.capacity, prev + 1))}
              >
                <Ionicons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Purpose Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Mục đích sử dụng phòng</Text>
            <TextInput
              style={styles.textInput}
              value={purpose}
              onChangeText={setPurpose}
              placeholder={
                currentUser.role === 'Giảng viên'
                  ? 'Ví dụ: Hướng dẫn đồ án, Dạy bù môn học...'
                  : 'Ví dụ: Họp nhóm đồ án môn AI, Tự học ôn thi...'
              }
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Bar (CTA) */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarSlot}>
            {selectedSlot ? selectedSlot.label : 'Chưa chọn khung giờ'}
          </Text>
          <Text style={styles.bottomBarDate}>
            {formatDateVietnamese(selectedDate)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedSlot || bookingMutation.isPending) && styles.submitButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={!selectedSlot || bookingMutation.isPending}
          activeOpacity={0.8}
        >
          {bookingMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Xác nhận đặt</Text>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.colors.white}
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: theme.colors.surfaceSubtle,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  floatingHeader: {
    position: 'absolute',
    top: 10,
    left: theme.spacing.lg,
    zIndex: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  floatingBadges: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: 4,
  },
  mainInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  roomName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  roomType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginVertical: 4,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  capacityText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: 6,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  subSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  equipmentName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: 6,
  },
  bookingSection: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  dateList: {
    paddingVertical: 4,
  },
  dateItem: {
    width: 60,
    height: 72,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateItemToday: {
    borderColor: theme.colors.primary,
  },
  dateItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateDayOfWeek: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dateDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  dateTextSelected: {
    color: theme.colors.white,
  },
  selectedDateLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  selectedDateBold: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  slotCardDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  slotCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotPeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  slotStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
  textSelected: {
    color: theme.colors.white,
  },
  userInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  userInfoTextWrap: {
    marginLeft: 10,
  },
  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  userRoleSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  attendeesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fieldHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingHorizontal: 12,
  },
  inputGroup: {
    marginTop: 4,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    marginTop: 6,
    minHeight: 44,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.lg,
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  bottomBarSlot: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bottomBarDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.lg,
    minHeight: 46,
    ...theme.shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: theme.colors.danger,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
