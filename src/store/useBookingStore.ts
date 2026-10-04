import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Booking,
  Building,
  Equipment,
  FilterState,
  Room,
  TimeSlotId,
  User,
  UserRole,
} from '../types';
import { MOCK_ROOMS } from '../data/mockRooms';
import { generateBookingCode, getTodayDateString } from '../utils/dateUtils';

export const DEFAULT_STUDENT_USER: User = {
  id: 'usr-sv-01',
  name: 'Lê Thị Hương Giang',
  code: '21IT2907',
  email: 'giang.lth@vku.udn.vn',
  role: 'Sinh viên',
  department: 'Khoa Công nghệ Thông tin & Truyền thông',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
};

export const DEFAULT_LECTURER_USER: User = {
  id: 'usr-gv-01',
  name: 'TS. Nguyễn Văn Hùng',
  code: 'VKU-GV1024',
  email: 'hung.nv@vku.udn.vn',
  role: 'Giảng viên',
  department: 'Khoa Khoa học Máy tính',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
};

const initialFilters: FilterState = {
  searchQuery: '',
  selectedBuilding: 'ALL',
  minCapacity: null,
  selectedEquipments: [],
  selectedDate: getTodayDateString(),
  selectedStatus: 'ALL',
};

// Khởi tạo một số lượt đặt mẫu để người dùng thấy ngay lịch đặt
const createInitialBookings = (): Booking[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'book-init-01',
      bookingCode: 'VKU-A101-7821',
      roomId: 'room-a-101',
      roomName: 'Phòng A.101 - Smart Classroom',
      roomCode: 'A.101',
      building: 'A',
      roomImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      date: today,
      slotId: 'slot_2',
      slotLabel: '09:30 - 11:30',
      userId: 'usr-sv-01',
      userName: 'Lê Thị Hương Giang',
      userCode: '21IT2907',
      userRole: 'Sinh viên',
      purpose: 'Thảo luận nhóm đề tài Capstone Project AI',
      attendeesCount: 8,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-init-02',
      bookingCode: 'VKU-V101-3419',
      roomId: 'room-v-101',
      roomName: 'Phòng V.101 - Smart Hall Quốc tế',
      roomCode: 'V.101',
      building: 'V',
      roomImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      date: today,
      slotId: 'slot_3',
      slotLabel: '13:00 - 15:00',
      userId: 'usr-other-02',
      userName: 'Trần Minh Hoàng',
      userCode: '20IT105',
      userRole: 'Sinh viên',
      purpose: 'Hội thảo CLB Lập trình VKU',
      attendeesCount: 18,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ];
};

interface BookingStoreState {
  // Dữ liệu người dùng & phiên
  currentUser: User;
  switchUserRole: (role?: UserRole) => void;

  // Danh sách phòng
  rooms: Room[];

  // Bộ lọc
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  setSelectedBuilding: (building: Building | 'ALL') => void;
  setMinCapacity: (capacity: number | null) => void;
  toggleEquipment: (equipment: Equipment) => void;
  setSelectedDate: (date: string) => void;
  setSelectedStatus: (status: 'ALL' | 'AVAILABLE' | 'BOOKED') => void;
  resetFilters: () => void;

  // Lịch đặt & chống xung đột (Atomic)
  bookings: Booking[];
  addBooking: (params: {
    roomId: string;
    date: string;
    slotId: TimeSlotId;
    slotLabel: string;
    purpose: string;
    attendeesCount: number;
    notificationId?: string;
  }) => { success: boolean; booking?: Booking; error?: string };
  cancelBooking: (bookingId: string) => { success: boolean; cancelledBooking?: Booking };
  isSlotBooked: (roomId: string, date: string, slotId: TimeSlotId) => boolean;
  getRoomBookings: (roomId: string, date: string) => Booking[];
  getFilteredRooms: () => Room[];
}

export const useBookingStore = create<BookingStoreState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_STUDENT_USER,
      rooms: MOCK_ROOMS,
      filters: initialFilters,
      bookings: createInitialBookings(),

      // Đổi vai trò Sinh viên <-> Giảng viên
      switchUserRole: (targetRole?: UserRole) => {
        const current = get().currentUser;
        if (targetRole) {
          set({
            currentUser: targetRole === 'Giảng viên' ? DEFAULT_LECTURER_USER : DEFAULT_STUDENT_USER,
          });
        } else {
          set({
            currentUser:
              current.role === 'Sinh viên' ? DEFAULT_LECTURER_USER : DEFAULT_STUDENT_USER,
          });
        }
      },

      // Quản lý bộ lọc
      setSearchQuery: (searchQuery: string) => {
        set((state) => ({
          filters: { ...state.filters, searchQuery },
        }));
      },

      setSelectedBuilding: (selectedBuilding: Building | 'ALL') => {
        set((state) => ({
          filters: { ...state.filters, selectedBuilding },
        }));
      },

      setMinCapacity: (minCapacity: number | null) => {
        set((state) => ({
          filters: { ...state.filters, minCapacity },
        }));
      },

      toggleEquipment: (equipment: Equipment) => {
        set((state) => {
          const current = state.filters.selectedEquipments;
          const exists = current.includes(equipment);
          const next = exists
            ? current.filter((e) => e !== equipment)
            : [...current, equipment];
          return {
            filters: { ...state.filters, selectedEquipments: next },
          };
        });
      },

      setSelectedDate: (selectedDate: string) => {
        set((state) => ({
          filters: { ...state.filters, selectedDate },
        }));
      },

      setSelectedStatus: (selectedStatus: 'ALL' | 'AVAILABLE' | 'BOOKED') => {
        set((state) => ({
          filters: { ...state.filters, selectedStatus },
        }));
      },

      resetFilters: () => {
        set({
          filters: {
            ...initialFilters,
            selectedDate: get().filters.selectedDate, // Giữ ngày đang chọn
          },
        });
      },

      // Kiểm tra xem khung giờ đã bị đặt chưa
      isSlotBooked: (roomId: string, date: string, slotId: TimeSlotId) => {
        return get().bookings.some(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status === 'confirmed'
        );
      },

      getRoomBookings: (roomId: string, date: string) => {
        return get().bookings.filter(
          (b) => b.roomId === roomId && b.date === date && b.status === 'confirmed'
        );
      },

      // Thao tác đặt phòng ATOMIC chống xung đột
      addBooking: ({
        roomId,
        date,
        slotId,
        slotLabel,
        purpose,
        attendeesCount,
        notificationId,
      }) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) {
          return { success: false, error: 'Không tìm thấy thông tin phòng học!' };
        }

        // Kiểm tra xung đột: Đã có ai đặt phòng này trong cùng ngày & khung giờ chưa
        const conflict = state.bookings.some(
          (b) =>
            b.roomId === roomId &&
            b.date === date &&
            b.slotId === slotId &&
            b.status === 'confirmed'
        );

        if (conflict) {
          return {
            success: false,
            error: `Rất tiếc! Phòng ${room.name} vào khung giờ ${slotLabel} đã có người đặt trước. Vui lòng chọn khung giờ hoặc phòng khác!`,
          };
        }

        // Tạo bản ghi đặt chỗ mới
        const user = state.currentUser;
        const newBooking: Booking = {
          id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          bookingCode: generateBookingCode(room.roomCode),
          roomId: room.id,
          roomName: room.name,
          roomCode: room.roomCode,
          building: room.building,
          roomImage: room.image,
          date,
          slotId,
          slotLabel,
          userId: user.id,
          userName: user.name,
          userCode: user.code,
          userRole: user.role,
          purpose: purpose || (user.role === 'Giảng viên' ? 'Giảng dạy & Cố vấn' : 'Học tập nhóm'),
          attendeesCount: attendeesCount || 2,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          notificationId,
        };

        // Cập nhật Atomic vào danh sách bookings
        set((prevState) => ({
          bookings: [newBooking, ...prevState.bookings],
        }));

        return { success: true, booking: newBooking };
      },

      // Hủy đặt chỗ
      cancelBooking: (bookingId: string) => {
        const state = get();
        const target = state.bookings.find((b) => b.id === bookingId);
        if (!target) {
          return { success: false };
        }

        set((prevState) => ({
          bookings: prevState.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
          ),
        }));

        return { success: true, cancelledBooking: target };
      },

      // Lọc danh sách phòng theo tất cả điều kiện
      getFilteredRooms: () => {
        const { rooms, filters, isSlotBooked } = get();
        const {
          searchQuery,
          selectedBuilding,
          minCapacity,
          selectedEquipments,
          selectedDate,
          selectedStatus,
        } = filters;

        return rooms.filter((room) => {
          // 1. Tìm theo từ khóa (tên phòng, mã phòng, loại phòng, mô tả)
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const matchName = room.name.toLowerCase().includes(query);
            const matchCode = room.roomCode.toLowerCase().includes(query);
            const matchType = room.type.toLowerCase().includes(query);
            const matchDesc = room.description.toLowerCase().includes(query);
            if (!matchName && !matchCode && !matchType && !matchDesc) {
              return false;
            }
          }

          // 2. Lọc theo tòa nhà
          if (selectedBuilding !== 'ALL' && room.building !== selectedBuilding) {
            return false;
          }

          // 3. Lọc theo sức chứa tối thiểu
          if (minCapacity !== null && room.capacity < minCapacity) {
            return false;
          }

          // 4. Lọc theo thiết bị (phải có tất cả thiết bị đã chọn)
          if (selectedEquipments.length > 0) {
            const hasAllEquipments = selectedEquipments.every((eq) =>
              room.equipment.includes(eq)
            );
            if (!hasAllEquipments) {
              return false;
            }
          }

          // 5. Lọc theo trạng thái (Còn trống / Đã đặt) tại ngày được chọn
          if (selectedStatus !== 'ALL') {
            // Xem phòng này trong ngày đó có còn slot nào trống hay không
            // 4 slot: slot_1, slot_2, slot_3, slot_4
            const slots: TimeSlotId[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4'];
            const bookedSlotsCount = slots.filter((slot) =>
              isSlotBooked(room.id, selectedDate, slot)
            ).length;

            const isAllBooked = bookedSlotsCount === slots.length;
            const hasAvailableSlot = bookedSlotsCount < slots.length;

            if (selectedStatus === 'AVAILABLE' && !hasAvailableSlot) {
              return false;
            }
            if (selectedStatus === 'BOOKED' && !isAllBooked) {
              return false;
            }
          }

          return true;
        });
      },
    }),
    {
      name: '@vku_room_booking_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        bookings: state.bookings,
      }),
    }
  )
);
