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

export type UserRole = 'Sinh viên' | 'Giảng viên';

export interface User {
  id: string;
  name: string;
  code: string;       // MSSV hoặc Mã cán bộ
  email: string;
  role: UserRole;
  department: string;
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
  userRole: UserRole;
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

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  RoomDetail: { roomId: string };
  BookingSuccess: { bookingId: string };
  QRCodeModal: { bookingId: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyBookingsTab: undefined;
  ProfileTab: undefined;
};
