import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList, Room, TimeSlotId } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { useNotifications } from '../hooks/useNotifications';
import { fetchRoomsApi } from '../api/roomApi';
import { getCurrentSlotId, isToday } from '../utils/dateUtils';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { FilterModal } from '../components/FilterModal';
import { RoomCard } from '../components/RoomCard';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // In-app Notifications
  const { unreadCount } = useNotifications();

  // TanStack Query: Lấy danh sách phòng giả lập qua mạng có độ trễ
  const {
    data: remoteRooms = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRoomsApi,
  });

  // Zustand Store: Quản lý trạng thái client (phiên, bộ lọc, lượt đặt)
  const currentUser = useBookingStore((state) => state.currentUser);
  const switchUserRole = useBookingStore((state) => state.switchUserRole);
  const filters = useBookingStore((state) => state.filters);
  const setSearchQuery = useBookingStore((state) => state.setSearchQuery);
  const setSelectedBuilding = useBookingStore((state) => state.setSelectedBuilding);
  const setMinCapacity = useBookingStore((state) => state.setMinCapacity);
  const toggleEquipment = useBookingStore((state) => state.toggleEquipment);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedStatus = useBookingStore((state) => state.setSelectedStatus);
  const resetFilters = useBookingStore((state) => state.resetFilters);
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);

  // Kết hợp danh sách phòng từ TanStack Query và bộ lọc client từ Zustand
  const filteredRooms = useMemo(() => {
    const {
      searchQuery,
      selectedBuilding,
      minCapacity,
      selectedEquipments,
      selectedDate,
      selectedStatus,
    } = filters;

    return remoteRooms.filter((room) => {
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

      // 5. Lọc theo trạng thái
      if (selectedStatus !== 'ALL') {
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
  }, [remoteRooms, filters, isSlotBooked]);

  // Khung giờ hiện tại (nếu đang trong giờ học và ngày chọn là hôm nay)
  const currentSlotInfo = useMemo(() => getCurrentSlotId(), []);
  const isSelectedToday = useMemo(() => isToday(filters.selectedDate), [filters.selectedDate]);

  // Đếm số lượng bộ lọc đang kích hoạt ngoài building
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minCapacity !== null) count++;
    if (filters.selectedEquipments.length > 0) count += filters.selectedEquipments.length;
    if (filters.selectedStatus !== 'ALL') count++;
    return count;
  }, [filters]);

  // Điều hướng tới chi tiết phòng
  const handleRoomPress = useCallback((roomId: string) => {
    navigation.navigate('RoomDetail', { roomId });
  }, [navigation]);

  // Tính số khung giờ còn trống (trên tổng 4 khung giờ) cho một phòng
  const getAvailableSlotsCount = useCallback(
    (roomId: string) => {
      const slots = ['slot_1', 'slot_2', 'slot_3', 'slot_4'] as const;
      const bookedCount = slots.filter((slot) =>
        isSlotBooked(roomId, filters.selectedDate, slot)
      ).length;
      return 4 - bookedCount;
    },
    [filters.selectedDate, isSlotBooked]
  );

  // Tính trạng thái phòng tức thời ngay tại thời điểm hiện tại: Occupied hay Available
  const getRealtimeOccupiedStatus = useCallback(
    (roomId: string): boolean | null => {
      if (!isSelectedToday || !currentSlotInfo) return null;
      return isSlotBooked(roomId, filters.selectedDate, currentSlotInfo.slotId);
    },
    [isSelectedToday, currentSlotInfo, filters.selectedDate, isSlotBooked]
  );

  // Render từng thẻ phòng (được tối ưu hóa bằng React.memo)
  const renderItem = useCallback(
    ({ item }: { item: Room }) => {
      const availableCount = getAvailableSlotsCount(item.id);
      const isOccupiedNow = getRealtimeOccupiedStatus(item.id);
      return (
        <RoomCard
          room={item}
          selectedDate={filters.selectedDate}
          availableSlotsCount={availableCount}
          isCurrentSlotOccupied={isOccupiedNow}
          onPress={handleRoomPress}
        />
      );
    },
    [filters.selectedDate, getAvailableSlotsCount, getRealtimeOccupiedStatus, handleRoomPress]
  );

  const keyExtractor = useCallback((item: Room) => item.id, []);

  // Header của danh sách
  const renderListHeader = useMemo(() => {
    return (
      <View style={styles.listHeader}>
        <Text style={styles.resultsCountText}>
          Tìm thấy <Text style={styles.resultsCountBold}>{filteredRooms.length}</Text> phòng học phù hợp
        </Text>
      </View>
    );
  }, [filteredRooms.length]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* 1. Header chính */}
      <Header
        user={currentUser}
        selectedDate={filters.selectedDate}
        onToggleUserRole={() => switchUserRole()}
        unreadCount={unreadCount}
        onPressNotifications={() => navigation.navigate('Notifications')}
      />

      {/* 2. Thanh tìm kiếm (có debounce) */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 3. Thanh bộ lọc nhanh */}
      <FilterBar
        selectedBuilding={filters.selectedBuilding}
        onSelectBuilding={setSelectedBuilding}
        onOpenFilterModal={() => setFilterModalVisible(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* 4. Danh sách phòng học với TanStack Query Loading / Error / Data */}
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>Đang tải dữ liệu phòng học...</Text>
          <Text style={styles.loadingSubtitle}>
            Đang kết nối giả lập API qua TanStack Query (300-500ms)
          </Text>
        </View>
      ) : isError ? (
        <EmptyState
          title="Không thể tải dữ liệu phòng"
          description="Đã xảy ra lỗi khi gọi API lấy danh sách phòng học. Vui lòng bấm nút bên dưới để thử lại!"
          actionText="Thử tải lại"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <EmptyState
              title="Không có phòng nào phù hợp"
              description="Hãy thử đổi tòa nhà, giảm bớt điều kiện thiết bị hoặc chọn ngày khác xem sao!"
              onAction={resetFilters}
            />
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal bộ lọc toàn diện */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onSelectBuilding={setSelectedBuilding}
        onSelectMinCapacity={setMinCapacity}
        onToggleEquipment={toggleEquipment}
        onSelectDate={setSelectedDate}
        onSelectStatus={setSelectedStatus}
        onResetFilters={resetFilters}
        totalFilteredCount={filteredRooms.length}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  resultsCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  resultsCountBold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  loadingSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
