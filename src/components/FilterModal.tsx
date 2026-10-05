import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Building, Equipment, FilterState } from '../types';
import { ALL_EQUIPMENT, BUILDINGS, CAPACITY_OPTIONS } from '../data/timeSlots';
import { getNext7Days } from '../utils/dateUtils';
import { AppPressable } from './AppPressable';
import { theme } from '../theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onSelectBuilding: (building: Building | 'ALL') => void;
  onSelectMinCapacity: (capacity: number | null) => void;
  onToggleEquipment: (equipment: Equipment) => void;
  onSelectDate: (date: string) => void;
  onSelectStatus: (status: 'ALL' | 'AVAILABLE' | 'BOOKED') => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onSelectBuilding,
  onSelectMinCapacity,
  onToggleEquipment,
  onSelectDate,
  onSelectStatus,
  onResetFilters,
  totalFilteredCount,
}) => {
  const next7Days = getNext7Days();

  const buildingLabels: Record<string, string> = {
    ALL: 'Tất cả tòa',
    A: 'Tòa A (Tech Hub)',
    B: 'Tòa B (Giảng đường)',
    C: 'Tòa C (Startup & Chip)',
    V: 'Tòa V (Smart Campus)',
  };

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'ALL' as const },
    { label: 'Còn trống ít nhất 1 slot', value: 'AVAILABLE' as const },
    { label: 'Đã kín lịch trong ngày', value: 'BOOKED' as const },
  ];

  const getEquipmentIcon = (eq: Equipment) => {
    switch (eq) {
      case 'Máy chiếu':
        return 'videocam-outline';
      case 'Bảng trắng':
        return 'easel-outline';
      case 'Máy tính cấu hình cao':
        return 'desktop-outline';
      case 'Điều hòa':
        return 'snow-outline';
      default:
        return 'cube-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bộ lọc tìm kiếm</Text>
              <Text style={styles.subtitle}>
                Tìm phòng phù hợp với nhu cầu học tập & nghiên cứu
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* 1. Chọn ngày (7 ngày tới) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Ngày sử dụng phòng</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateList}
              >
                {next7Days.map((d) => {
                  const isSelected = filters.selectedDate === d.date;
                  return (
                    <TouchableOpacity
                      key={d.date}
                      style={[
                        styles.dateCard,
                        isSelected && styles.dateCardSelected,
                        d.isToday && styles.dateCardToday,
                      ]}
                      onPress={() => onSelectDate(d.date)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateDayOfWeek,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        {d.dayOfWeek}
                      </Text>
                      <Text
                        style={[
                          styles.dateDayNumber,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        {d.dayNumber}
                      </Text>
                      <Text
                        style={[
                          styles.dateMonth,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        Th{d.monthNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Tòa nhà */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Tòa nhà VKU</Text>
              </View>
              <View style={styles.optionsWrap}>
                {BUILDINGS.map((b) => {
                  const isSelected = filters.selectedBuilding === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.selectableChip,
                        isSelected && styles.selectableChipSelected,
                      ]}
                      onPress={() => onSelectBuilding(b)}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelSelected,
                        ]}
                      >
                        {buildingLabels[b]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Sức chứa */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Sức chứa tối thiểu</Text>
              </View>
              <View style={styles.optionsWrap}>
                {CAPACITY_OPTIONS.map((cap) => {
                  const isSelected = filters.minCapacity === cap.value;
                  return (
                    <TouchableOpacity
                      key={cap.label}
                      style={[
                        styles.selectableChip,
                        isSelected && styles.selectableChipSelected,
                      ]}
                      onPress={() => onSelectMinCapacity(cap.value)}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelSelected,
                        ]}
                      >
                        {cap.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Trang thiết bị (Chọn nhiều) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hardware-chip-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Trang thiết bị (chọn nhiều)</Text>
              </View>
              <View style={styles.optionsWrap}>
                {ALL_EQUIPMENT.map((eq) => {
                  const isSelected = filters.selectedEquipments.includes(eq);
                  return (
                    <TouchableOpacity
                      key={eq}
                      style={[
                        styles.equipmentChip,
                        isSelected && styles.equipmentChipSelected,
                      ]}
                      onPress={() => onToggleEquipment(eq)}
                    >
                      <Ionicons
                        name={getEquipmentIcon(eq)}
                        size={16}
                        color={isSelected ? theme.colors.white : theme.colors.textSecondary}
                        style={styles.eqIcon}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelSelected,
                        ]}
                      >
                        {eq}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={theme.colors.white}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. Trạng thái phòng */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Trạng thái phòng</Text>
              </View>
              <View style={styles.optionsWrap}>
                {statusOptions.map((st) => {
                  const isSelected = filters.selectedStatus === st.value;
                  return (
                    <TouchableOpacity
                      key={st.value}
                      style={[
                        styles.selectableChip,
                        isSelected && styles.selectableChipSelected,
                      ]}
                      onPress={() => onSelectStatus(st.value)}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelSelected,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <AppPressable
              style={styles.resetButton}
              onPress={onResetFilters}
              scaleTo={0.95}
              accessibilityRole="button"
              accessibilityLabel="Xóa bộ lọc"
            >
              <Ionicons name="refresh-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.resetButtonText}>Xóa bộ lọc</Text>
            </AppPressable>

            <AppPressable
              style={styles.applyButton}
              onPress={onClose}
              scaleTo={0.96}
              accessibilityRole="button"
              accessibilityLabel={`Xem ${totalFilteredCount} phòng`}
            >
              <Text style={styles.applyButtonText}>
                Xem {totalFilteredCount} phòng
              </Text>
            </AppPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  content: {
    maxHeight: 460,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: 6,
  },
  dateList: {
    paddingVertical: 4,
  },
  dateCard: {
    width: 62,
    height: 72,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  dateCardToday: {
    borderColor: theme.colors.primary,
  },
  dateCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateDayOfWeek: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dateDayNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  dateTextSelected: {
    color: theme.colors.white,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectableChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectableChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chipLabelSelected: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  equipmentChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eqIcon: {
    marginRight: 6,
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceSubtle,
    marginRight: theme.spacing.md,
    minHeight: 46,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    minHeight: 46,
    ...theme.shadows.sm,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
