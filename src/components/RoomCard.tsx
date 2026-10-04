import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../types';
import { Badge } from './Badge';
import { theme } from '../theme';

interface RoomCardProps {
  room: Room;
  selectedDate: string;
  availableSlotsCount: number;
  onPress: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = memo(({
  room,
  availableSlotsCount,
  onPress,
}) => {
  const isAllBooked = availableSlotsCount === 0;

  const getBuildingVariant = () => {
    switch (room.building) {
      case 'A':
        return 'buildingA';
      case 'B':
        return 'buildingB';
      case 'C':
        return 'buildingC';
      case 'V':
        return 'buildingV';
      default:
        return 'primary';
    }
  };

  const getEquipmentIcon = (eq: string) => {
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
        return 'checkmark-circle-outline';
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Image & Floating Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: room.image }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient/Dimming overlay for readability */}
        <View style={styles.imageGradientOverlay} />

        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          <Badge
            label={`Tòa ${room.building} - Tầng ${room.floor}`}
            variant={getBuildingVariant()}
            size="sm"
          />

          <Badge
            label={isAllBooked ? 'Đã kín lịch' : `Còn ${availableSlotsCount}/4 khung giờ`}
            variant={isAllBooked ? 'danger' : 'success'}
            size="sm"
            icon={
              <Ionicons
                name={isAllBooked ? 'close-circle' : 'time-outline'}
                size={12}
                color={isAllBooked ? theme.colors.dangerDark : theme.colors.successDark}
              />
            }
          />
        </View>

        {/* Room Type Tag on bottom of image */}
        <View style={styles.bottomImageBadge}>
          <Text style={styles.roomTypeTagText}>{room.type}</Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.body}>
        {/* Title & Capacity Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.name}
            </Text>
            <Text style={styles.roomCode}>Mã: {room.roomCode}</Text>
          </View>

          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={15} color={theme.colors.primary} />
            <Text style={styles.capacityText}>{room.capacity} người</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {room.description}
        </Text>

        {/* Equipment Badges */}
        <View style={styles.equipmentRow}>
          {room.equipment.map((eq) => (
            <View key={eq} style={styles.equipmentChip}>
              <Ionicons
                name={getEquipmentIcon(eq) as any}
                size={13}
                color={theme.colors.primary}
                style={styles.equipmentIcon}
              />
              <Text style={styles.equipmentText}>{eq}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Footer with CTA Button (min 44px touch target) */}
        <View style={styles.footerRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text style={styles.ratingText}>{room.rating ?? '5.0'}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isAllBooked && styles.actionButtonDisabled,
            ]}
            onPress={() => onPress(room.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Xem và đặt ${room.name}`}
          >
            <Text style={styles.actionButtonText}>
              {isAllBooked ? 'Xem lịch kín' : 'Xem & Đặt phòng'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.white}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: 165,
    backgroundColor: theme.colors.surfaceSubtle,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  topBadgesRow: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomImageBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  roomTypeTagText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  body: {
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  titleArea: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  roomName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  roomCode: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: 2,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.full,
  },
  capacityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginVertical: theme.spacing.xs,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  equipmentIcon: {
    marginRight: 4,
  },
  equipmentText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: theme.minTouchTarget,
    ...theme.shadows.sm,
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  chevronIcon: {
    marginLeft: 4,
  },
});
