import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình cách hiển thị thông báo khi ứng dụng đang chạy ở foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Xin quyền gửi thông báo từ người dùng và thiết lập Android Channel
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vku_booking_reminders', {
        name: 'VKU Nhắc nhở lịch phòng',
        description: 'Thông báo nhắc nhở 15 phút trước giờ nhận phòng học tại VKU',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Lỗi khi xin quyền thông báo:', error);
    return false;
  }
}

/**
 * Lên lịch thông báo nhắc nhở 15 phút trước khi khung giờ bắt đầu
 */
export async function scheduleBookingReminder(booking: {
  id: string;
  roomName: string;
  roomCode: string;
  date: string;       // YYYY-MM-DD
  slotLabel: string;  // '07:30 - 09:30'
  slotId: string;     // 'slot_1', 'slot_2'...
}): Promise<string | undefined> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return undefined;
  }

  try {
    // 1. Xác định giờ bắt đầu ca học
    const slotStartTimes: Record<string, string> = {
      slot_1: '07:30',
      slot_2: '09:30',
      slot_3: '13:00',
      slot_4: '15:00',
    };
    const startTimeStr = slotStartTimes[booking.slotId] || booking.slotLabel.split('-')[0].trim();
    const [startHour, startMin] = startTimeStr.split(':').map((v) => parseInt(v, 10));

    const dateParts = booking.date.split('-').map((v) => parseInt(v, 10));
    const bookingStartTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], startHour, startMin, 0);

    // 2. Mốc thông báo: 15 phút trước giờ nhận phòng
    const reminderTime = new Date(bookingStartTime.getTime() - 15 * 60 * 1000);
    const now = Date.now();

    let trigger: Notifications.NotificationTriggerInput;

    if (reminderTime.getTime() > now) {
      // Thời gian nhắc nhở trong tương lai
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      };
    } else {
      // Nếu thời gian đặt cách ca học ít hơn 15 phút, lên lịch nhắc sau 4 giây
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 4,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ [VKU] Nhắc nhở: Sắp đến giờ nhận phòng học!',
        body: `Phòng ${booking.roomName} (${booking.roomCode}) của bạn sẽ bắt đầu lúc ${startTimeStr}. Vui lòng mở mã QR để check-in!`,
        data: {
          bookingId: booking.id,
          roomCode: booking.roomCode,
        },
        sound: true,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.warn('Lỗi khi lên lịch thông báo nhắc phòng:', error);
    return undefined;
  }
}

/**
 * Hủy thông báo nhắc nhở đã lên lịch khi người dùng hủy đặt phòng
 */
export async function cancelBookingReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Lỗi khi hủy thông báo:', error);
  }
}

/**
 * =========================================================================
 * DEMO FUNCTION: Gửi thông báo thử sau 5 giây
 * GHI CHÚ: Nút dành riêng cho demo, giúp quay video kiểm tra thông báo
 * mà không cần phải chờ đến sát giờ ca đặt phòng thực tế.
 * =========================================================================
 */
export async function sendDemoTestNotification(delaySeconds = 5): Promise<string> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error('Ứng dụng chưa được cấp quyền nhận thông báo. Vui lòng cho phép quyền thông báo trong Cài đặt thiết bị!');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 [DEMO VKU] Nhắc nhở nhận phòng học thành công!',
      body: `Đây là thông báo thử nghiệm sau ${delaySeconds} giây. Phòng Lab A.201 của bạn sắp bắt đầu ca học. Mở app để quét mã QR!`,
      data: { isDemo: true, timestamp: Date.now() },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });

  return notificationId;
}
