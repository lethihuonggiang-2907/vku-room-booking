import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Room } from '../types';
import { useBookingStore } from '../store/useBookingStore';
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

  // Zustand Store
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
  const getFilteredRooms = useBookingStore((state) => state.getFilteredRooms);
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);

  // Filtered rooms
  const filteredRooms = getFilteredRooms();

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

  // Render từng thẻ phòng (được tối ưu hóa bằng React.memo)
  const renderItem = useCallback(
    ({ item }: { item: Room }) => {
      const availableCount = getAvailableSlotsCount(item.id);
      return (
        <RoomCard
          room={item}
          selectedDate={filters.selectedDate}
          availableSlotsCount={availableCount}
          onPress={handleRoomPress}
        />
      );
    },
    [filters.selectedDate, getAvailableSlotsCount, handleRoomPress]
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

      {/* 4. Danh sách phòng học (FlatList tối ưu 60fps) */}
      <FlatList
        data={filteredRooms}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
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
});
