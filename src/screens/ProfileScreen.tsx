import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../store/useBookingStore';
import { Badge } from '../components/Badge';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const currentUser = useBookingStore((state) => state.currentUser);
  const switchUserRole = useBookingStore((state) => state.switchUserRole);
  const bookings = useBookingStore((state) => state.bookings);

  const userBookings = bookings.filter((b) => b.userId === currentUser.id);
  const confirmedCount = userBookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = userBookings.filter((b) => b.status === 'cancelled').length;

  const isLecturer = currentUser.role === 'Giảng viên';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <Text style={styles.headerSubtitle}>
            Thông tin tài khoản trường Đại học CNTT & TT Việt - Hàn
          </Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userCode}>
            {isLecturer ? 'Mã cán bộ' : 'MSSV'}: {currentUser.code}
          </Text>

          <View style={styles.roleBadgeContainer}>
            <Badge
              label={currentUser.role}
              variant={isLecturer ? 'warning' : 'primary'}
              size="md"
              icon={
                <Ionicons
                  name={isLecturer ? 'school' : 'person'}
                  size={14}
                  color={isLecturer ? theme.colors.warning : theme.colors.primary}
                />
              }
            />
          </View>

          {/* Role switcher toggle button */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => switchUserRole()}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={18} color={theme.colors.white} />
            <Text style={styles.switchButtonText}>
              Chuyển sang vai trò {isLecturer ? 'Sinh viên' : 'Giảng viên'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userBookings.length}</Text>
            <Text style={styles.statLabel}>Tổng lượt đặt</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.colors.successDark }]}>
              {confirmedCount}
            </Text>
            <Text style={styles.statLabel}>Thành công</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.colors.danger }]}>
              {cancelledCount}
            </Text>
            <Text style={styles.statLabel}>Đã hủy</Text>
          </View>
        </View>

        {/* Info Details Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin liên hệ & Học vụ</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Email trường</Text>
              <Text style={styles.infoValue}>{currentUser.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Khoa / Đơn vị</Text>
              <Text style={styles.infoValue}>{currentUser.department}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.successDark} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Trạng thái tài khoản</Text>
              <Text style={[styles.infoValue, { color: theme.colors.successDark }]}>
                Đã xác thực SSO VKU
              </Text>
            </View>
          </View>
        </View>

        {/* App Info & Version */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>Ứng dụng VKU Room Booking</Text>
          <Text style={styles.appInfoText}>Phiên bản 1.0.0 (Expo SDK 57)</Text>
          <Text style={styles.appInfoText}>
            Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  userCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  roleBadgeContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    minHeight: theme.minTouchTarget,
    ...theme.shadows.sm,
  },
  switchButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.heavy,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  infoCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginTop: 1,
  },
  appInfoCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  appInfoTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  appInfoText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
