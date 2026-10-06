import { User, UserRole, AuthProvider } from '../../types';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  schoolName?: string;
  department: string;
  identifierCode: string;
  className?: string;
  academicYear?: string;
  academicDegree?: string;
  adminInviteCode?: string;
  avatar?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ProviderLoginDTO {
  provider: 'google' | 'facebook';
  mockUser: {
    id?: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
    identifierCode?: string;
    avatar?: string;
    className?: string;
    academicYear?: string;
    academicDegree?: string;
  };
}

/**
 * Interface chuẩn cho hệ thống Authentication của ứng dụng.
 * Mọi lớp triển khai (LocalAuthService, FirebaseAuthService, MockAuthService)
 * đều phải tuân theo giao diện này.
 * Giao diện người dùng và Store KHÔNG được phụ thuộc trực tiếp vào lớp triển khai cụ thể.
 */
export interface AuthService {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  register(dto: RegisterDTO): Promise<User>;

  /**
   * Đăng nhập bằng email trường và mật khẩu
   */
  login(dto: LoginDTO): Promise<User>;

  /**
   * Đăng nhập thông qua nhà cung cấp liên kết (Google / Facebook)
   * Luồng mô phỏng SSO dành cho môi trường trường học
   */
  loginWithProvider(dto: ProviderLoginDTO): Promise<User>;

  /**
   * Đăng xuất và xóa phiên hiện tại
   */
  logout(): Promise<void>;

  /**
   * Khôi phục phiên làm việc đã lưu từ SecureStore/AsyncStorage
   */
  restoreSession(): Promise<User | null>;
}
