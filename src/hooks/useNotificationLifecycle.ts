import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useBookingStore } from '../store/useBookingStore';
import { useNotifications } from './useNotifications';
import { navigationRef } from '../navigation/RootNavigator';

interface NotificationPayloadData {
  isDemo?: boolean;
  bookingId?: string;
  roomCode?: string;
  type?: string;
}

/**
 * Custom Hook useNotificationLifecycle quản lý vòng đời ứng dụng và thông báo:
 * 1. Tự động đồng bộ các nhắc nhở check-in khi app mở hoặc quay lại foreground.
 * 2. Lắng nghe thông báo hệ thống khi app đang mở (foreground) để thêm vào In-App Box.
 * 3. Lắng nghe khi người dùng bấm vào banner thông báo hệ thống để điều hướng đúng màn hình.
 */
export function useNotificationLifecycle() {
  const {
    syncCheckinReminders,
    notifyDemoReceived,
    markAsRead,
  } = useNotifications();

  // 1. Đồng bộ nhắc nhở check-in khi app mở và khi app quay lại foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const bookings = useBookingStore.getState().bookings;
        syncCheckinReminders(bookings);
      }
    };

    // Kiểm tra ngay khi khởi động
    const initialBookings = useBookingStore.getState().bookings;
    syncCheckinReminders(initialBookings);

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncCheckinReminders]);

  // 2. Lắng nghe sự kiện thông báo hệ thống (nhận thông báo & bấm vào thông báo)
  useEffect(() => {
    // Sự kiện khi thông báo đến trong lúc app đang chạy (foreground)
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = (notification.request.content.data || {}) as NotificationPayloadData;
      const content = notification.request.content.body || '';

      if (data.isDemo) {
        // Thông báo Demo sau 5 giây
        notifyDemoReceived(content);
      } else if (data.bookingId) {
        // Đồng bộ lại nhắc nhở check-in từ bookings
        const bookings = useBookingStore.getState().bookings;
        syncCheckinReminders(bookings);
      }
    });

    // Sự kiện khi người dùng nhấn vào banner thông báo trên thanh trạng thái
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data || {}) as NotificationPayloadData;

      if (data.bookingId) {
        // Đánh dấu thông báo tương ứng là đã đọc
        markAsRead(`reminder-${data.bookingId}`);

        // Điều hướng tới mã QR check-in nếu có thể
        if (navigationRef.isReady()) {
          navigationRef.navigate('QRCodeModal', { bookingId: data.bookingId });
        }
      } else {
        // Nếu là thông báo demo hoặc thông báo chung, mở Hộp thông báo
        if (navigationRef.isReady()) {
          navigationRef.navigate('Notifications');
        }
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [markAsRead, notifyDemoReceived, syncCheckinReminders]);
}
