import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, UserRole } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { getRoleLabel, DEFAULT_SCHOOL_NAME } from '../constants/authConstants';
import { isAuthFirebaseMode } from '../services/auth';
import { theme } from '../theme';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface MockSocialAccount {
  name: string;
  email: string;
  role: UserRole;
  identifierCode: string;
  department: string;
  className?: string;
  academicYear?: string;
  academicDegree?: string;
}

const MOCK_GOOGLE_ACCOUNTS: MockSocialAccount[] = [
  {
    name: 'Lê Thị Hương Giang',
    email: 'giang.lth@vku.udn.vn',
    role: 'student',
    identifierCode: '21IT2907',
    department: 'Khoa Công nghệ Thông tin & Truyền thông',
    className: '21IT1',
    academicYear: '2021 - 2026',
  },
  {
    name: 'TS. Nguyễn Văn Hùng',
    email: 'hung.nv@vku.udn.vn',
    role: 'lecturer',
    identifierCode: 'VKU-GV1024',
    department: 'Khoa Khoa học Máy tính',
    academicDegree: 'Tiến sĩ',
  },
  {
    name: 'Nguyễn Thành Nam',
    email: 'namnt.22it@vku.udn.vn',
    role: 'student',
    identifierCode: '22IT045',
    department: 'Khoa Kỹ thuật Máy tính & Điện tử',
    className: '22IT2',
    academicYear: '2022 - 2027',
  },
];

const MOCK_FACEBOOK_ACCOUNTS: MockSocialAccount[] = [
  {
    name: 'Huỳnh Bá Đạt',
    email: 'dathb.21it@vku.udn.vn',
    role: 'student',
    identifierCode: '21IT098',
    department: 'Khoa Kinh tế số & Thương mại điện tử',
    className: '21BA1',
    academicYear: '2021 - 2026',
  },
  {
    name: 'ThS. Trần Thị Mai',
    email: 'maitt@vku.udn.vn',
    role: 'lecturer',
    identifierCode: 'VKU-GV2045',
    department: 'Khoa Công nghệ Thông tin & Truyền thông',
    academicDegree: 'Thạc sĩ',
  },
];

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, register, loginWithProvider, isLoading, error, clearError } = useAuthStore();
  const isFirebaseMode = isAuthFirebaseMode();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Modal giả lập OAuth Google / Facebook
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'facebook'>('google');

  // Xử lý đăng nhập email & password thường
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return;
    }
    clearError();
    await login({
      email: email.trim(),
      password,
    });
  };

  // Nút đăng nhập nhanh tài khoản demo phục vụ quay video báo cáo
  const handleQuickDemoLogin = async (role: UserRole) => {
    clearError();

    if (role === 'student') {
      setEmail('giang.lth@vku.udn.vn');
      setPassword('Demo@123456');
      const ok = await login({ email: 'giang.lth@vku.udn.vn', password: 'Demo@123456' });
      // Ở chế độ Firebase, tự động tạo tài khoản demo Sinh viên nếu chưa tồn tại
      if (!ok && isFirebaseMode) {
        await register({
          name: 'Lê Thị Hương Giang',
          email: 'giang.lth@vku.udn.vn',
          password: 'Demo@123456',
          role: 'student',
          schoolName: DEFAULT_SCHOOL_NAME,
          department: 'Khoa Công nghệ Thông tin & Truyền thông',
          identifierCode: '21IT2907',
          className: '21IT1',
          academicYear: '2021 - 2026',
        });
      }
    } else if (role === 'lecturer') {
      setEmail('hung.nv@vku.udn.vn');
      setPassword('Demo@123456');
      const ok = await login({ email: 'hung.nv@vku.udn.vn', password: 'Demo@123456' });
      // Ở chế độ Firebase, tự động tạo tài khoản demo Giảng viên nếu chưa tồn tại
      if (!ok && isFirebaseMode) {
        await register({
          name: 'TS. Nguyễn Văn Hùng',
          email: 'hung.nv@vku.udn.vn',
          password: 'Demo@123456',
          role: 'lecturer',
          schoolName: DEFAULT_SCHOOL_NAME,
          department: 'Khoa Khoa học Máy tính',
          identifierCode: 'VKU-GV1024',
          academicDegree: 'Tiến sĩ',
        });
      }
    } else {
      setEmail('admin@vku.udn.vn');
      setPassword('Demo@123456');
      const ok = await login({ email: 'admin@vku.udn.vn', password: 'Demo@123456' });
      // Ở chế độ Firebase, tài khoản admin chỉ đăng nhập vào tài khoản do người dùng tự tạo trên console
      if (!ok && isFirebaseMode) {
        useAuthStore.setState({
          error:
            'Tài khoản Quản trị viên (admin@vku.udn.vn) chưa tồn tại trên Firebase. Vui lòng tạo tài khoản trên Firebase Console và gán vai trò "admin" trong collection users theo hướng dẫn README.',
        });
      }
    }
  };

  // Mở modal giả lập đăng nhập mạng xã hội
  const handleOpenSocialModal = (provider: 'google' | 'facebook') => {
    clearError();
    setSelectedProvider(provider);
    setSocialModalVisible(true);
  };

  // Chọn tài khoản mẫu từ modal OAuth giả lập
  const handleSelectMockSocialUser = async (account: MockSocialAccount) => {
    setSocialModalVisible(false);
    await loginWithProvider({
      provider: selectedProvider,
      mockUser: {
        name: account.name,
        email: account.email,
        role: account.role,
        identifierCode: account.identifierCode,
        department: account.department,
        className: account.className,
        academicYear: account.academicYear,
        academicDegree: account.academicDegree,
      },
    });
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Logo Thương hiệu VKU */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>VKU</Text>
            </View>
            <Text style={styles.appName}>VKU Room Booking</Text>
            <Text style={styles.appSubtitle}>
              Cổng Đăng nhập Hệ thống Đặt phòng học thông minh
            </Text>

            {/* Ghi chú hiển thị chế độ hệ thống: Firebase Cloud hoặc Demo / Offline */}
            <View style={styles.modeBadgeWrapper}>
              <View
                style={[
                  styles.modeBadge,
                  isFirebaseMode ? styles.modeBadgeFirebase : styles.modeBadgeOffline,
                ]}
              >
                <Ionicons
                  name={isFirebaseMode ? 'cloud-done-outline' : 'hardware-chip-outline'}
                  size={14}
                  color={isFirebaseMode ? '#047857' : '#B45309'}
                />
                <Text
                  style={[
                    styles.modeBadgeText,
                    isFirebaseMode ? styles.modeBadgeTextFirebase : styles.modeBadgeTextOffline,
                  ]}
                >
                  {isFirebaseMode ? 'Chế độ Firebase Cloud' : 'Chế độ demo/offline'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Đăng nhập */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardDescription}>
              Sử dụng tài khoản email trường VKU của bạn để tiếp tục
            </Text>

            {/* Thông báo lỗi tiếng Việt nếu có */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.dangerDark} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Ô nhập Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email trường</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ví dụ: giang.lth@vku.udn.vn"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Ô nhập Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) clearError();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút Đăng nhập chính */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (!isFormValid || isLoading) && styles.primaryBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Liên kết sang Đăng ký */}
            <View style={styles.registerLinkRow}>
              <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLinkText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Phân cách */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Nút đăng nhập Google & Facebook (Luồng giả lập) */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleOpenSocialModal('google')}
                activeOpacity={0.75}
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleOpenSocialModal('facebook')}
                activeOpacity={0.75}
              >
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                <Text style={styles.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Khu vực Demo: Đăng nhập nhanh 1-chạm khi quay video báo cáo */}
          <View style={styles.demoSection}>
            <View style={styles.demoHeaderRow}>
              <Ionicons name="flash" size={16} color={theme.colors.secondary} />
              <Text style={styles.demoSectionTitle}>Tài khoản Demo (1-Chạm quay video)</Text>
            </View>
            <Text style={styles.demoSectionDesc}>
              Nhấn để tự động điền và đăng nhập ngay với vai trò tương ứng:
            </Text>

            <View style={styles.demoBtnGroup}>
              <TouchableOpacity
                style={[styles.demoQuickBtn, styles.demoBtnStudent]}
                onPress={() => handleQuickDemoLogin('student')}
                activeOpacity={0.75}
              >
                <Ionicons name="person" size={14} color={theme.colors.primary} />
                <View style={styles.demoBtnTextWrap}>
                  <Text style={styles.demoBtnTitle}>Sinh viên</Text>
                  <Text style={styles.demoBtnSub}>Lê Thị Hương Giang</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoQuickBtn, styles.demoBtnLecturer]}
                onPress={() => handleQuickDemoLogin('lecturer')}
                activeOpacity={0.75}
              >
                <Ionicons name="school" size={14} color="#B45309" />
                <View style={styles.demoBtnTextWrap}>
                  <Text style={[styles.demoBtnTitle, { color: '#92400E' }]}>Giảng viên</Text>
                  <Text style={styles.demoBtnSub}>TS. Nguyễn Văn Hùng</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoQuickBtn, styles.demoBtnAdmin]}
                onPress={() => handleQuickDemoLogin('admin')}
                activeOpacity={0.75}
              >
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.dangerDark} />
                <View style={styles.demoBtnTextWrap}>
                  <Text style={[styles.demoBtnTitle, { color: theme.colors.dangerDark }]}>
                    Quản trị viên
                  </Text>
                  <Text style={styles.demoBtnSub}>Admin VKU</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Bảng chọn tài khoản giả lập SSO OAuth */}
      <Modal
        visible={socialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={selectedProvider === 'google' ? 'logo-google' : 'logo-facebook'}
                  size={22}
                  color={selectedProvider === 'google' ? '#EA4335' : '#1877F2'}
                />
                <Text style={styles.modalTitle}>
                  Đăng nhập với {selectedProvider === 'google' ? 'Google' : 'Facebook'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSocialModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Nhãn chế độ demo */}
            <View style={styles.modalNotice}>
              <Ionicons name="information-circle" size={16} color="#B45309" />
              <Text style={styles.modalNoticeText}>
                Chế độ demo: Đây là luồng mô phỏng SSO danh tính nhà trường, không gọi OAuth mạng ngoài.
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>Chọn một tài khoản mẫu để tiếp tục:</Text>

            {/* Danh sách tài khoản mock */}
            <View style={styles.mockAccountsList}>
              {(selectedProvider === 'google'
                ? MOCK_GOOGLE_ACCOUNTS
                : MOCK_FACEBOOK_ACCOUNTS
              ).map((acc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.mockAccountItem}
                  onPress={() => handleSelectMockSocialUser(acc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.mockAvatarBox}>
                    <Text style={styles.mockAvatarLetter}>{acc.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.mockAccountDetails}>
                    <Text style={styles.mockAccountName}>{acc.name}</Text>
                    <Text style={styles.mockAccountEmail}>{acc.email}</Text>
                    <Text style={styles.mockAccountRole}>
                      {getRoleLabel(acc.role)} • {acc.department}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSocialModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  logoBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.heavy,
    letterSpacing: 2,
  },
  appName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  appSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modeBadgeWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  modeBadgeFirebase: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modeBadgeOffline: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modeBadgeTextFirebase: {
    color: '#047857',
  },
  modeBadgeTextOffline: {
    color: '#B45309',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.dangerDark,
    fontWeight: theme.typography.fontWeight.medium,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    paddingVertical: 10,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
    marginTop: theme.spacing.sm,
    gap: 8,
    ...theme.shadows.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  registerPrompt: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  registerLinkText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: 44,
    gap: 8,
  },
  socialBtnText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  demoSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#15803D',
  },
  demoSectionDesc: {
    fontSize: 11,
    color: '#166534',
    marginBottom: theme.spacing.md,
  },
  demoBtnGroup: {
    gap: 8,
  },
  demoQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    minHeight: 46,
    gap: 10,
  },
  demoBtnStudent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  demoBtnLecturer: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  demoBtnAdmin: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  demoBtnTextWrap: {
    flex: 1,
  },
  demoBtnTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  demoBtnSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  modalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  mockAccountsList: {
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  mockAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: 52,
    gap: 10,
  },
  mockAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAvatarLetter: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  mockAccountDetails: {
    flex: 1,
  },
  mockAccountName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  mockAccountEmail: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  mockAccountRole: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  modalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  modalCancelText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
});
