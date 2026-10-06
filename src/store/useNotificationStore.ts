import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, AppNotificationType } from '../types';

export interface AddNotificationInput {
  id?: string;
  userId?: string;
  type: AppNotificationType;
  title: string;
  content: string;
  bookingId?: string;
  createdAt?: string;
  isRead?: boolean;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  addNotification: (input: AddNotificationInput) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

// Danh sách thông báo mẫu khởi tạo
const createInitialNotifications = (): AppNotification[] => {
  const now = Date.now();
  return [
    {
      id: 'notif-init-01',
      userId: 'usr-sv-01',
      type: 'booking_confirmed',
      title: 'Đặt phòng học thành công',
      content: 'Lịch đặt phòng A.101 - Smart Classroom vào lúc 09:30 - 11:30 đã được xác nhận. Mã đặt: VKU-A101-7821.',
      bookingId: 'book-init-01',
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(), // 15 phút trước
      isRead: false,
    },
    {
      id: 'notif-init-02',
      userId: 'usr-sv-01',
      type: 'checkin_reminder',
      title: 'Nhắc nhở nhận phòng sắp tới',
      content: 'Chỉ còn 15 phút nữa là đến giờ nhận phòng A.101. Vui lòng mở mã QR sẵn sàng để check-in tại cửa phòng!',
      bookingId: 'book-init-01',
      createdAt: new Date(now - 1000 * 60 * 5).toISOString(), // 5 phút trước
      isRead: false,
    },
    {
      id: 'notif-init-03',
      userId: 'usr-sv-01',
      type: 'demo',
      title: 'Chào mừng bạn đến với VKU Room Booking',
      content: 'Ứng dụng đã sẵn sàng hỗ trợ bạn tra cứu và đặt phòng học, phòng Lab thông minh tại trường ĐH CNTT&TT Việt - Hàn.',
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
      isRead: true,
    },
  ];
};

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: createInitialNotifications(),

      // Thêm thông báo mới (chống trùng lặp id)
      addNotification: (input: AddNotificationInput) => {
        const state = get();
        const notificationId = input.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Kiểm tra nếu id đã tồn tại (ví dụ nhắc nhở checkin của cùng 1 booking)
        const existing = state.notifications.find((n) => n.id === notificationId);
        if (existing) {
          return existing;
        }

        const newNotification: AppNotification = {
          id: notificationId,
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          bookingId: input.bookingId,
          createdAt: input.createdAt || new Date().toISOString(),
          isRead: input.isRead ?? false,
        };

        set((prevState) => ({
          notifications: [newNotification, ...prevState.notifications],
        }));

        return newNotification;
      },

      // Đánh dấu một thông báo là đã đọc
      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      // Đánh dấu tất cả thông báo là đã đọc
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      // Xóa một thông báo
      deleteNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      // Xóa toàn bộ thông báo
      clearAll: () => {
        set({ notifications: [] });
      },

      // Đếm số lượng thông báo chưa đọc
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: '@vku_notifications_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
