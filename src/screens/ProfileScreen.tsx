import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { Badge } from '../components/Badge';
import { AppPressable } from '../components/AppPressable';
import { sendDemoTestNotification } from '../utils/notificationService';
import { useNotifications } from '../hooks/useNotifications';
import { getRoleLabel } from '../constants/authConstants';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const [isSendingDemo, setIsSendingDemo] = useState(false);
  const { notifyDemoReceived } = useNotifications();

  const authUser = useAuthStore((state) => state.user);
  const bookingUser = useBookingStore((state) => state.currentUser);
  const currentUser = authUser || bookingUser;
  const { logout, isLoading: isAuthLoading } = useAuthStore();

  const bookings = useBookingStore((state) => state.bookings);

  // Lọc lịch đặt gắn theo ID người dùng hiện tại
  const userBookings = bookings.filter((b) => b.userId === currentUser.id);
  const confirmedCount = userBookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = userBookings.filter((b) => b.status === 'cancelled').length;

  const isStudent = currentUser.role === 'student';
  const isLecturer = currentUser.role === 'lecturer';
  const isAdmin = currentUser.role === 'admin';

  // Chuyển đổi tên nhà cung cấp đăng nhập sang tiếng Việt
  const getProviderLabel = () => {
    switch (currentUser.authProvider) {
      case 'google':
        return 'Tài khoản Google (SSO)';
      case 'facebook':
        return 'Tài khoản Facebook (SSO)';
      case 'email':
      default:
        return 'Email trường VKU';
    }
  };

  // Xử lý đăng xuất có xác nhận
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VKU Room Booking không?'
      );
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        'Xác nhận đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VKU Room Booking không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: () => logout(),
          },
        ]
      );
    }
  };

  // Handler cho nút demo thông báo 5 giây
  const handleSendDemoNotification = async () => {
    try {
      setIsSendingDemo(true);
      await sendDemoTestNotification(5);

      // Thêm vào Hộp thông báo in-app đúng lúc thông báo hệ thống xuất hiện sau 5 giây
      setTimeout(() => {
        notifyDemoReceived(
          'Đây là thông báo thử nghiệm sau 5 giây. Phòng Lab A.201 của bạn sắp bắt đầu ca học. Mở app để quét mã QR!'
        );
      }, 5000);

      Alert.alert(
        'Đã lên lịch thông báo Demo!',
        'Thông báo nhắc nhở nhận phòng sẽ tự động xuất hiện trên màn hình sau 5 giây (kể cả khi bạn khóa màn hình hoặc chuyển sang ứng dụng khác).',
        [{ text: 'Đã hiểu' }]
      );
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Vui lòng kiểm tra quyền thông báo trong Cài đặt.';
      Alert.alert('Không thể gửi thông báo', errMessage);
    } finally {
      setIsSendingDemo(false);
    }
  };

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
            {isAdmin ? 'Mã cán bộ QTV' : isLecturer ? 'Mã giảng viên' : 'MSSV'}:{' '}
            {currentUser.identifierCode || currentUser.code}
          </Text>

          <View style={styles.roleBadgeContainer}>
            <Badge
              label={getRoleLabel(currentUser.role)}
              variant={isAdmin ? 'danger' : isLecturer ? 'warning' : 'primary'}
              size="md"
              icon={
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : isLecturer ? 'school' : 'person'}
                  size={14}
                  color={
                    isAdmin
                      ? theme.colors.danger
                      : isLecturer
                      ? theme.colors.warning
                      : theme.colors.primary
                  }
                />
              }
            />
          </View>
        </View>

        {/* Stats Row (chỉ hiển thị lượt đặt của người dùng hiện tại) */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userBookings.length}</Text>
            <Text style={styles.statLabel}>Lượt đặt của bạn</Text>
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

        {/* Info Details Card: Thông tin thật của người dùng */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin liên hệ & Học vụ</Text>

          {/* Email trường */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Email trường</Text>
              <Text style={styles.infoValue}>{currentUser.email}</Text>
            </View>
          </View>

          {/* Tên trường */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="school-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Cơ sở đào tạo</Text>
              <Text style={styles.infoValue}>{currentUser.schoolName}</Text>
            </View>
          </View>

          {/* Khoa / Đơn vị */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Khoa / Phòng ban</Text>
              <Text style={styles.infoValue}>{currentUser.department}</Text>
            </View>
          </View>

          {/* Nếu là sinh viên: Lớp & Niên khóa */}
          {isStudent && (
            <>
              {currentUser.className && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoTextBox}>
                    <Text style={styles.infoLabel}>Lớp sinh hoạt</Text>
                    <Text style={styles.infoValue}>{currentUser.className}</Text>
                  </View>
                </View>
              )}

              {currentUser.academicYear && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoTextBox}>
                    <Text style={styles.infoLabel}>Niên khóa</Text>
                    <Text style={styles.infoValue}>{currentUser.academicYear}</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Nếu là giảng viên: Học vị */}
          {isLecturer && currentUser.academicDegree && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <Ionicons name="ribbon-outline" size={18} color={theme.colors.warning} />
              </View>
              <View style={styles.infoTextBox}>
                <Text style={styles.infoLabel}>Học vị</Text>
                <Text style={styles.infoValue}>{currentUser.academicDegree}</Text>
              </View>
            </View>
          )}

          {/* Phương thức đăng nhập */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="key-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Phương thức đăng nhập</Text>
              <Text style={styles.infoValue}>{getProviderLabel()}</Text>
            </View>
          </View>

          {/* Trạng thái xác thực */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.successDark} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Trạng thái tài khoản</Text>
              <Text style={[styles.infoValue, { color: theme.colors.successDark }]}>
                Đã xác thực danh tính VKU
              </Text>
            </View>
          </View>
        </View>

        {/* Nút Đăng xuất tài khoản */}
        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isAuthLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất khỏi tài khoản"
          >
            {isAuthLoading ? (
              <ActivityIndicator color={theme.colors.dangerDark} size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.dangerDark} />
                <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* KHU VỰC DEMO: Nút gửi thông báo thử sau 5 giây để quay video báo cáo */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <View style={styles.demoIconWrap}>
              <Ionicons name="notifications" size={20} color="#7C3AED" />
            </View>
            <View style={styles.demoHeaderTextWrap}>
              <Text style={styles.demoCardTitle}>Demo Thông Báo Nhắc Phòng</Text>
              <Text style={styles.demoCardSubtitle}>
                Dành cho quay video: Nhận thông báo sau 5 giây
              </Text>
            </View>
          </View>

          <AppPressable
            style={[styles.demoButton, isSendingDemo && styles.demoButtonDisabled]}
            onPress={handleSendDemoNotification}
            disabled={isSendingDemo}
            scaleTo={0.96}
            accessibilityRole="button"
            accessibilityLabel="Gửi thông báo thử sau 5 giây"
          >
            {isSendingDemo ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="timer-outline" size={18} color={theme.colors.white} />
                <Text style={styles.demoButtonText}>Gửi thông báo thử sau 5 giây</Text>
              </>
            )}
          </AppPressable>
          <Text style={styles.demoNoteText}>
            💡 Nhấn nút, sau đó bạn có thể giữ nguyên app hoặc chuyển sang màn hình khác để thấy thông báo pop-up xuất hiện sau 5 giây.
          </Text>
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
  logoutCard: {
    marginTop: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.dangerDark,
  },
  demoCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    ...theme.shadows.sm,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  demoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  demoHeaderTextWrap: {
    flex: 1,
  },
  demoCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#6D28D9',
  },
  demoCardSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: '#7C3AED',
    marginTop: 2,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: 46,
    ...theme.shadows.sm,
  },
  demoButtonDisabled: {
    opacity: 0.6,
  },
  demoButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 6,
  },
  demoNoteText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
    fontStyle: 'italic',
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
