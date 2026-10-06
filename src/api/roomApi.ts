import { Room, TimeSlotId, UserRole } from '../types';
import { MOCK_ROOMS } from '../data/mockRooms';

export interface CreateBookingApiParams {
  roomId: string;
  date: string;
  slotId: TimeSlotId;
  slotLabel: string;
  purpose: string;
  attendeesCount: number;
  userId: string;
  userName: string;
  userCode: string;
  userRole: UserRole | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
}

/**
 * Giả lập API gọi lấy danh sách phòng từ Backend Server
 * Có độ trễ mô phỏng mạng (300ms - 500ms)
 */
export async function fetchRoomsApi(): Promise<Room[]> {
  // Giả lập độ trễ mạng thực tế 450ms
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Trả về danh sách phòng
  return [...MOCK_ROOMS];
}

/**
 * Giả lập API lấy chi tiết một phòng học theo ID
 */
export async function fetchRoomByIdApi(roomId: string): Promise<Room | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const found = MOCK_ROOMS.find((r) => r.id === roomId);
  return found || null;
}

/**
 * Giả lập API đặt phòng gửi lên Backend Server
 * Mô phỏng mutation xử lý tại server (độ trễ 500ms)
 */
export async function createBookingApi(
  params: CreateBookingApiParams
): Promise<ApiResponse<{ bookingId: string; bookingCode: string }>> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const room = MOCK_ROOMS.find((r) => r.id === params.roomId);
  if (!room) {
    return {
      success: false,
      statusCode: 404,
      message: 'Không tìm thấy phòng học trên hệ thống máy chủ.',
    };
  }

  const cleanCode = room.roomCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `VKU-${cleanCode}-${randomNum}`;
  const bookingId = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    success: true,
    statusCode: 201,
    message: 'Đặt phòng học thành công trên hệ thống máy chủ VKU!',
    data: {
      bookingId,
      bookingCode,
    },
  };
}
