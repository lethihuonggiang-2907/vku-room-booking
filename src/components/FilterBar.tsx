import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Building } from '../types';
import { BUILDINGS } from '../data/timeSlots';
import { theme } from '../theme';

interface FilterBarProps {
  selectedBuilding: Building | 'ALL';
  onSelectBuilding: (building: Building | 'ALL') => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedBuilding,
  onSelectBuilding,
  onOpenFilterModal,
  activeFilterCount,
}) => {
  const buildingLabels: Record<string, string> = {
    ALL: 'Tất cả',
    A: 'Tòa A',
    B: 'Tòa B',
    C: 'Tòa C',
    V: 'Tòa V (Smart)',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Nút mở Modal bộ lọc nâng cao */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={onOpenFilterModal}
          activeOpacity={0.7}
          accessibilityLabel="Bộ lọc nâng cao"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? theme.colors.white : theme.colors.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              activeFilterCount > 0 && styles.filterButtonTextActive,
            ]}
          >
            Lọc
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Các chip chọn Tòa nhà */}
        {BUILDINGS.map((b) => {
          const isSelected = selectedBuilding === b;
          return (
            <TouchableOpacity
              key={b}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectBuilding(b)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {buildingLabels[b]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  badgeCount: {
    backgroundColor: theme.colors.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeCountText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
