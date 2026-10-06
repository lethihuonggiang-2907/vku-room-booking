import { useMemo, useCallback } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { AppNotification, Booking } from '../types';

/**
 * Định dạng thời gian tương đối (ví dụ: 'Vừa xong', '5 phút trước', '2 giờ trước'...)
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const now = Date.now();
    const date = new Date(isoString).getTime();
    const diffMs = now - date;

    if (diffMs < 0) {
      return 'Vừa xong';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Vừa xong';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    }
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    if (diffDays === 1) {
      return 'Hôm qua';
    }
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'Vừa xong';
  }
}

/**
 * Custom Hook useNotifications quản lý toàn bộ nghiệp vụ thông báo in-app
 * Phân quyền & tách biệt dữ liệu: Người dùng chỉ thấy thông báo gắn theo id của chính mình
 */
export function useNotifications() {
  const allNotifications = useNotificationStore((state) => state.notifications);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);
  const clearAll = useNotificationStore((state) => state.clearAll);

  // Lấy ID người dùng đang đăng nhập
  const authUser = useAuthStore((state) => state.user);
  const bookingUser = useBookingStore((state) => state.currentUser);
  const currentUserId = authUser?.id || bookingUser?.id;

  // Lọc thông báo chỉ cho người dùng hiện tại
  const userNotifications = useMemo(() => {
    if (!currentUserId) return [];
    return allNotifications.filter((n) => n.userId === currentUserId);
  }, [allNotifications, currentUserId]);

  // Đếm số lượng thông báo chưa đọc của người dùng hiện tại
  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.isRead).length;
  }, [userNotifications]);

  // Thông báo khi đặt phòng thành công
  const notifyBookingConfirmed = useCallback(
    (booking: Booking) => {
      addNotification({
        id: `notif-confirmed-${booking.id}`,
        userId: booking.userId || currentUserId,
        type: 'booking_confirmed',
        title: 'Đặt phòng học thành công',
        content: `Bạn đã đặt thành công phòng ${booking.roomName} (${booking.roomCode}) vào khung giờ ${booking.slotLabel}, ngày ${booking.date}. Mã đặt: ${booking.bookingCode}.`,
        bookingId: booking.id,
      });
    },
    [addNotification, currentUserId]
  );

  // Thông báo khi hủy đặt phòng
  const notifyBookingCancelled = useCallback(
    (booking: Booking) => {
      addNotification({
        id: `notif-cancelled-${booking.id}-${Date.now()}`,
        userId: booking.userId || currentUserId,
        type: 'booking_cancelled',
        title: 'Đã hủy lịch đặt phòng',
        content: `Lịch đặt phòng ${booking.roomName} vào lúc ${booking.slotLabel}, ngày ${booking.date} đã được hủy bỏ thành công.`,
        bookingId: booking.id,
      });
    },
    [addNotification, currentUserId]
  );

  // Thông báo Demo sau 5 giây
  const notifyDemoReceived = useCallback(
    (message?: string) => {
      addNotification({
        userId: currentUserId,
        type: 'demo',
        title: '🔔 Thông báo thử nghiệm (Demo)',
        content:
          message ||
          'Thông báo thử nghiệm hệ thống sau 5 giây đã hoạt động chuẩn xác! Mở QR hoặc kiểm tra lịch của bạn.',
      });
    },
    [addNotification, currentUserId]
  );

  /**
   * Đồng bộ nhắc nhở check-in (15 phút trước giờ ca học)
   * Duyệt các lượt đặt 'confirmed' của chính người dùng: nếu đã đến thời điểm nhắc
   * mà chưa có mục nhắc tương ứng trong store thì tự động tạo mới.
   */
  const syncCheckinReminders = useCallback(
    (bookings: Booking[]) => {
      const slotStartHours: Record<string, { hour: number; minute: number }> = {
        slot_1: { hour: 7, minute: 30 },
        slot_2: { hour: 9, minute: 30 },
        slot_3: { hour: 13, minute: 0 },
        slot_4: { hour: 15, minute: 0 },
      };

      const now = Date.now();
      const userBookings = bookings.filter((b) => b.userId === currentUserId);

      userBookings.forEach((booking) => {
        if (booking.status !== 'confirmed') return;

        const timeInfo = slotStartHours[booking.slotId];
        if (!timeInfo) return;

        const parts = booking.date.split('-').map((v) => parseInt(v, 10));
        if (parts.length !== 3) return;

        const startTime = new Date(
          parts[0],
          parts[1] - 1,
          parts[2],
          timeInfo.hour,
          timeInfo.minute
        ).getTime();
        const reminderTime = startTime - 15 * 60 * 1000; // 15 phút trước
        const slotEndTime = startTime + 2 * 60 * 60 * 1000; // Hết ca học (+2 tiếng)

        // Nếu đã đến mốc 15 phút trước ca học và chưa hết ca học quá 1 ngày
        if (now >= reminderTime && now <= slotEndTime + 24 * 60 * 60 * 1000) {
          const reminderNotifId = `reminder-${booking.id}`;
          addNotification({
            id: reminderNotifId,
            userId: booking.userId,
            type: 'checkin_reminder',
            title: `Nhắc nhở: Sắp đến giờ nhận phòng ${booking.roomCode}`,
            content: `Ca học lúc ${booking.slotLabel} tại ${booking.roomName} sắp bắt đầu. Vui lòng chuẩn bị mã QR để cán bộ hoặc cửa quét mở phòng.`,
            bookingId: booking.id,
          });
        }
      });
    },
    [addNotification, currentUserId]
  );

  return {
    notifications: userNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notifyBookingConfirmed,
    notifyBookingCancelled,
    notifyDemoReceived,
    syncCheckinReminders,
    formatRelativeTime,
  };
}
