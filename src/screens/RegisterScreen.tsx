import React, { useState, useMemo } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, UserRole } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import {
  DEFAULT_SCHOOL_NAME,
  DEFAULT_EMAIL_DOMAIN,
  ADMIN_INVITE_CODE,
  VKU_DEPARTMENTS,
  ACADEMIC_DEGREES,
  ACADEMIC_YEARS,
} from '../constants/authConstants';
import { theme } from '../theme';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const route = useRoute<RegisterRouteProp>();
  const { register, isLoading, error, clearError } = useAuthStore();

  // 1. Vai trò (Mặc định là sinh viên, hoặc nhận từ params)
  const [role, setRole] = useState<UserRole>(route.params?.initialRole || 'student');

  // 2. Các trường chung
  const [name, setName] = useState('');
  const [schoolName] = useState(DEFAULT_SCHOOL_NAME);
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<string>(VKU_DEPARTMENTS[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 3. Các trường theo vai trò
  const [identifierCode, setIdentifierCode] = useState(''); // MSSV / Mã GV / Mã Cán bộ
  const [className, setClassName] = useState(''); // Sinh viên: Lớp
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]); // Sinh viên: Niên khóa
  const [academicDegree, setAcademicDegree] = useState<string>(''); // Giảng viên: Học vị (tùy chọn)
  const [adminInviteCode, setAdminInviteCode] = useState(''); // Quản trị viên: Mã mời

  // State quản lý việc người dùng đã chạm vào ô (touched) để hiển thị lỗi
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Modal chọn khoa / phòng ban
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  // Modal chọn niên khóa (cho sinh viên)
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Tính độ mạnh mật khẩu (Password Strength Meter)
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: theme.colors.border, width: '0%' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score === 1) {
      return { score: 1, label: 'Yếu (cần thêm số hoặc chữ)', color: theme.colors.danger, width: '33%' };
    }
    if (score === 2) {
      return { score: 2, label: 'Khá (nên thêm chữ hoa & ký tự đặc biệt)', color: theme.colors.warning, width: '66%' };
    }
    return { score: 3, label: 'Mạnh và an toàn', color: theme.colors.successDark, width: '100%' };
  }, [password]);

  // Kiểm tra lỗi từng ô (Live validation)
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // Họ tên
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên';
    } else if (name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Email trường
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập email trường';
    } else if (!trimmedEmail.endsWith(DEFAULT_EMAIL_DOMAIN)) {
      errors.email = `Email trường bắt buộc phải kết thúc bằng ${DEFAULT_EMAIL_DOMAIN}`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ';
    }

    // Mã định danh
    if (!identifierCode.trim()) {
      if (role === 'student') errors.identifierCode = 'Vui lòng nhập Mã số sinh viên (MSSV)';
      else if (role === 'lecturer') errors.identifierCode = 'Vui lòng nhập Mã giảng viên';
      else errors.identifierCode = 'Vui lòng nhập Mã cán bộ quản trị';
    }

    // Sinh viên: Lớp và niên khóa
    if (role === 'student') {
      if (!className.trim()) {
        errors.className = 'Vui lòng nhập lớp sinh hoạt (ví dụ: 21IT1)';
      }
    }

    // Quản trị viên: Mã mời
    if (role === 'admin') {
      if (!adminInviteCode.trim()) {
        errors.adminInviteCode = `Vui lòng nhập mã mời quản trị (Mã demo: ${ADMIN_INVITE_CODE})`;
      } else if (adminInviteCode.trim() !== ADMIN_INVITE_CODE) {
        errors.adminInviteCode = `Mã mời không đúng (Mã demo chính xác: ${ADMIN_INVITE_CODE})`;
      }
    }

    // Mật khẩu
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự';
    } else if (!(/[a-zA-Z]/.test(password) && /[0-9]/.test(password))) {
      errors.password = 'Mật khẩu phải chứa cả chữ cái và chữ số';
    }

    // Xác nhận mật khẩu
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    return errors;
  }, [name, email, identifierCode, role, className, adminInviteCode, password, confirmPassword]);

  // Form hợp lệ khi không còn bất kỳ lỗi nào
  const isFormValid = Object.keys(validationErrors).length === 0;

  // Xử lý gửi đăng ký
  const handleRegister = async () => {
    // Đánh dấu toàn bộ ô là touched
    setTouched({
      name: true,
      email: true,
      identifierCode: true,
      className: true,
      adminInviteCode: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) return;

    clearError();
    await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      schoolName,
      department,
      identifierCode: identifierCode.trim().toUpperCase(),
      className: role === 'student' ? className.trim() : undefined,
      academicYear: role === 'student' ? academicYear : undefined,
      academicDegree: role === 'lecturer' ? academicDegree || undefined : undefined,
      adminInviteCode: role === 'admin' ? adminInviteCode.trim() : undefined,
    });
  };

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
          {/* Nút quay lại Đăng nhập */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backBtnText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>

          {/* Tiêu đề màn hình */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đăng ký tài khoản</Text>
            <Text style={styles.headerSubtitle}>
              Hệ thống phòng học thông minh VKU - {schoolName}
            </Text>
          </View>

          {/* BƯỚC 1: CHỌN VAI TRÒ (3 THẺ) */}
          <View style={styles.roleSelectionContainer}>
            <Text style={styles.sectionLabel}>1. Chọn vai trò của bạn:</Text>
            <View style={styles.roleCardsRow}>
              {/* Thẻ Sinh viên */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'student' && styles.roleCardActive,
                ]}
                onPress={() => {
                  setRole('student');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    role === 'student' && styles.roleIconBoxActive,
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={role === 'student' ? theme.colors.white : theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardTitle,
                    role === 'student' && styles.roleCardTitleActive,
                  ]}
                >
                  Sinh viên
                </Text>
                {role === 'student' && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Thẻ Giảng viên */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'lecturer' && styles.roleCardActive,
                ]}
                onPress={() => {
                  setRole('lecturer');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    role === 'lecturer' && styles.roleIconBoxActive,
                  ]}
                >
                  <Ionicons
                    name="school"
                    size={20}
                    color={role === 'lecturer' ? theme.colors.white : '#B45309'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardTitle,
                    role === 'lecturer' && styles.roleCardTitleActive,
                  ]}
                >
                  Giảng viên
                </Text>
                {role === 'lecturer' && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Thẻ Quản trị viên */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'admin' && styles.roleCardActive,
                ]}
                onPress={() => {
                  setRole('admin');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    role === 'admin' && styles.roleIconBoxActive,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={role === 'admin' ? theme.colors.white : theme.colors.dangerDark}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardTitle,
                    role === 'admin' && styles.roleCardTitleActive,
                  ]}
                >
                  Quản trị viên
                </Text>
                {role === 'admin' && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Form Thông tin chi tiết */}
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>2. Thông tin cá nhân & Tài khoản:</Text>

            {/* Báo lỗi hệ thống chung (ví dụ: email đã trùng) */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.dangerDark} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.name && validationErrors.name ? styles.inputError : null,
                ]}
                placeholder="Ví dụ: Lê Thị Hương Giang"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) clearError();
                }}
                onBlur={() => markTouched('name')}
              />
              {touched.name && validationErrors.name ? (
                <Text style={styles.fieldErrorText}>{validationErrors.name}</Text>
              ) : null}
            </View>

            {/* Tên trường (Mặc định cố định) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên trường</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.readOnlyText}>{schoolName}</Text>
              </View>
            </View>

            {/* Email trường */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email trường *</Text>
                <Text style={styles.domainHint}>Bắt buộc đuôi {DEFAULT_EMAIL_DOMAIN}</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  touched.email && validationErrors.email ? styles.inputError : null,
                ]}
                placeholder={`ví dụ: giang.lth${DEFAULT_EMAIL_DOMAIN}`}
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) clearError();
                }}
                onBlur={() => markTouched('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && validationErrors.email ? (
                <Text style={styles.fieldErrorText}>{validationErrors.email}</Text>
              ) : null}
            </View>

            {/* Khoa / Đơn vị */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Khoa / Đơn vị *</Text>
              <TouchableOpacity
                style={styles.pickerSelector}
                onPress={() => setDeptModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.pickerSelectorText} numberOfLines={1}>
                  {department}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* =======================================================
                CÁC TRƯỜNG ĐẶC THÙ THEO VAI TRÒ
               ======================================================= */}
            {/* 1. SINH VIÊN: MSSV, Lớp, Niên khóa */}
            {role === 'student' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mã số sinh viên (MSSV) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.identifierCode && validationErrors.identifierCode
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder="Ví dụ: 21IT2907"
                    placeholderTextColor={theme.colors.textMuted}
                    value={identifierCode}
                    onChangeText={(text) => {
                      setIdentifierCode(text);
                      if (error) clearError();
                    }}
                    onBlur={() => markTouched('identifierCode')}
                    autoCapitalize="characters"
                  />
                  {touched.identifierCode && validationErrors.identifierCode ? (
                    <Text style={styles.fieldErrorText}>
                      {validationErrors.identifierCode}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.twoColRow}>
                  {/* Lớp */}
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Lớp sinh hoạt *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.className && validationErrors.className
                          ? styles.inputError
                          : null,
                      ]}
                      placeholder="Ví dụ: 21IT1"
                      placeholderTextColor={theme.colors.textMuted}
                      value={className}
                      onChangeText={(text) => {
                        setClassName(text);
                        if (error) clearError();
                      }}
                      onBlur={() => markTouched('className')}
                      autoCapitalize="characters"
                    />
                    {touched.className && validationErrors.className ? (
                      <Text style={styles.fieldErrorText}>{validationErrors.className}</Text>
                    ) : null}
                  </View>

                  {/* Niên khóa */}
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Niên khóa</Text>
                    <TouchableOpacity
                      style={styles.pickerSelector}
                      onPress={() => setYearModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerSelectorText} numberOfLines={1}>
                        {academicYear}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* 2. GIẢNG VIÊN: Mã giảng viên, Học vị */}
            {role === 'lecturer' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mã giảng viên *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.identifierCode && validationErrors.identifierCode
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder="Ví dụ: VKU-GV1024"
                    placeholderTextColor={theme.colors.textMuted}
                    value={identifierCode}
                    onChangeText={(text) => {
                      setIdentifierCode(text);
                      if (error) clearError();
                    }}
                    onBlur={() => markTouched('identifierCode')}
                    autoCapitalize="characters"
                  />
                  {touched.identifierCode && validationErrors.identifierCode ? (
                    <Text style={styles.fieldErrorText}>
                      {validationErrors.identifierCode}
                    </Text>
                  ) : null}
                </View>

                {/* Học vị (Tùy chọn) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Học vị (Tùy chọn)</Text>
                  <View style={styles.degreeChipsRow}>
                    {ACADEMIC_DEGREES.map((deg) => (
                      <TouchableOpacity
                        key={deg}
                        style={[
                          styles.degreeChip,
                          academicDegree === deg && styles.degreeChipActive,
                        ]}
                        onPress={() =>
                          setAcademicDegree((prev) => (prev === deg ? '' : deg))
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.degreeChipText,
                            academicDegree === deg && styles.degreeChipTextActive,
                          ]}
                        >
                          {deg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* 3. QUẢN TRỊ VIÊN: Mã cán bộ, Mã mời */}
            {role === 'admin' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mã cán bộ quản trị *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.identifierCode && validationErrors.identifierCode
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder="Ví dụ: VKU-CB001"
                    placeholderTextColor={theme.colors.textMuted}
                    value={identifierCode}
                    onChangeText={(text) => {
                      setIdentifierCode(text);
                      if (error) clearError();
                    }}
                    onBlur={() => markTouched('identifierCode')}
                    autoCapitalize="characters"
                  />
                  {touched.identifierCode && validationErrors.identifierCode ? (
                    <Text style={styles.fieldErrorText}>
                      {validationErrors.identifierCode}
                    </Text>
                  ) : null}
                </View>

                {/* Mã mời quản trị */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Mã mời quản trị viên *</Text>
                    {/* Chip bấm nhanh mã demo tiện lợi khi chấm điểm */}
                    <TouchableOpacity
                      onPress={() => setAdminInviteCode(ADMIN_INVITE_CODE)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.autoFillInviteText}>
                        Điền mã demo ({ADMIN_INVITE_CODE})
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      touched.adminInviteCode && validationErrors.adminInviteCode
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder={`Nhập ${ADMIN_INVITE_CODE}`}
                    placeholderTextColor={theme.colors.textMuted}
                    value={adminInviteCode}
                    onChangeText={(text) => {
                      setAdminInviteCode(text);
                      if (error) clearError();
                    }}
                    onBlur={() => markTouched('adminInviteCode')}
                    autoCapitalize="characters"
                  />
                  {touched.adminInviteCode && validationErrors.adminInviteCode ? (
                    <Text style={styles.fieldErrorText}>
                      {validationErrors.adminInviteCode}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            {/* Mật khẩu & Thanh độ mạnh */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu (Tối thiểu 8 ký tự, có chữ và số) *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.inputInner,
                    touched.password && validationErrors.password ? styles.inputErrorInner : null,
                  ]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) clearError();
                  }}
                  onBlur={() => markTouched('password')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Thanh độ mạnh mật khẩu */}
              {password.length > 0 && (
                <View style={styles.strengthMeterContainer}>
                  <View style={styles.strengthBarBackground}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: passwordStrength.width as any,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    Độ mạnh: {passwordStrength.label}
                  </Text>
                </View>
              )}

              {touched.password && validationErrors.password ? (
                <Text style={styles.fieldErrorText}>{validationErrors.password}</Text>
              ) : null}
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.inputInner,
                    touched.confirmPassword && validationErrors.confirmPassword
                      ? styles.inputErrorInner
                      : null,
                  ]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) clearError();
                  }}
                  onBlur={() => markTouched('confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && validationErrors.confirmPassword ? (
                <Text style={styles.fieldErrorText}>{validationErrors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Nút Đăng ký (Chỉ sáng khi form hoàn toàn hợp lệ) */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (!isFormValid || isLoading) && styles.primaryBtnDisabled,
              ]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color={theme.colors.white} />
                  <Text style={styles.primaryBtnText}>Đăng ký & Đăng nhập ngay</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Chọn Khoa / Đơn vị */}
      <Modal
        visible={deptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Khoa / Đơn vị</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {VKU_DEPARTMENTS.map((dept, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOptionItem,
                    department === dept && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setDepartment(dept);
                    setDeptModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      department === dept && styles.modalOptionTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                  {department === dept && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Chọn Niên khóa */}
      <Modal
        visible={yearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Niên khóa</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {ACADEMIC_YEARS.map((yr, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOptionItem,
                    academicYear === yr && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setAcademicYear(yr);
                    setYearModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      academicYear === yr && styles.modalOptionTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                  {academicYear === yr && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    minHeight: 44,
    gap: 6,
  },
  backBtnText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
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
    marginTop: 4,
  },
  roleSelectionContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.sm,
  },
  roleCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconBoxActive: {
    backgroundColor: theme.colors.primary,
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  roleCardTitleActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  domainHint: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  autoFillInviteText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: theme.typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
  },
  readOnlyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    fontSize: 11,
    color: theme.colors.dangerDark,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
    position: 'relative',
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    paddingRight: 44,
  },
  inputErrorInner: {
    borderColor: theme.colors.danger,
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  pickerSelectorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  degreeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  degreeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  degreeChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  degreeChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  degreeChipTextActive: {
    color: '#92400E',
    fontWeight: theme.typography.fontWeight.bold,
  },
  strengthMeterContainer: {
    marginTop: 6,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: theme.typography.fontWeight.medium,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
    marginTop: theme.spacing.lg,
    gap: 8,
    ...theme.shadows.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
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
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 420,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    minHeight: 44,
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: theme.borderRadius.sm,
  },
  modalOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    flex: 1,
  },
  modalOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
