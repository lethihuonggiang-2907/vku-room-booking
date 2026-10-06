export type Building = 'A' | 'B' | 'C' | 'V';

export type Equipment = 'Máy chiếu' | 'Bảng trắng' | 'Máy tính cấu hình cao' | 'Điều hòa';

export type RoomType =
  | 'Phòng học lý thuyết'
  | 'Phòng Lab máy tính'
  | 'Phòng thực hành IoT & AI'
  | 'Phòng hội thảo'
  | 'Phòng tự học nhóm';

export interface Room {
  id: string;
  name: string;
  roomCode: string;
  building: Building;
  floor: number;
  capacity: number;
  equipment: Equipment[];
  image: string;
  type: RoomType;
  description: string;
  rating?: number;
}

export type TimeSlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';

export interface TimeSlot {
  id: TimeSlotId;
  label: string;      // '07:30 - 09:30'
  startTime: string;  // '07:30'
  endTime: string;    // '09:30'
  period: 'Sáng' | 'Chiều';
}

export type UserRole = 'student' | 'lecturer' | 'admin';
export type AuthProvider = 'email' | 'google' | 'facebook';

export interface User {
  id: string;
  name: string;               // Họ và tên
  email: string;              // Email trường
  role: UserRole;             // 3 vai trò: student (Sinh viên), lecturer (Giảng viên), admin (Quản trị viên)
  schoolName: string;         // Tên trường
  department: string;         // Khoa / Đơn vị
  identifierCode: string;     // Mã định danh theo vai trò (mã SV / mã GV / mã cán bộ)
  code: string;               // Giữ tương thích ngược (alias identifierCode)
  className?: string;         // Lớp (chỉ sinh viên)
  academicYear?: string;      // Niên khóa (chỉ sinh viên)
  academicDegree?: string;    // Học vị (tùy chọn cho giảng viên)
  authProvider: AuthProvider; // email | google | facebook
  avatar: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'checked_in';

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "VKU-A101-7892"
  roomId: string;
  roomName: string;
  roomCode: string;
  building: Building;
  roomImage: string;
  date: string;        // YYYY-MM-DD
  slotId: TimeSlotId;
  slotLabel: string;
  userId: string;
  userName: string;
  userCode: string;
  userRole: UserRole | string;
  purpose: string;
  attendeesCount: number;
  status: BookingStatus;
  createdAt: string;
  notificationId?: string;
}

export interface FilterState {
  searchQuery: string;
  selectedBuilding: Building | 'ALL';
  minCapacity: number | null;
  selectedEquipments: Equipment[];
  selectedDate: string; // YYYY-MM-DD
  selectedStatus: 'ALL' | 'AVAILABLE' | 'BOOKED';
}

export type AppNotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'checkin_reminder'
  | 'demo';

export interface AppNotification {
  id: string;
  userId?: string;     // Gắn theo id người dùng để phân tách dữ liệu
  type: AppNotificationType;
  title: string;
  content: string;
  bookingId?: string;
  createdAt: string; // ISO string
  isRead: boolean;
}

// Navigation types
export type AuthStackParamList = {
  Login: { registeredEmail?: string; successMessage?: string } | undefined;
  Register: { initialRole?: UserRole } | undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  RoomDetail: { roomId: string };
  BookingSuccess: { bookingId: string };
  QRCodeModal: { bookingId: string };
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyBookingsTab: undefined;
  AdminTab: undefined;
  ProfileTab: undefined;
};

