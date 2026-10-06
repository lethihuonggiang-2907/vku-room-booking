import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { User } from '../../types';
import {
  AuthService,
  LoginDTO,
  ProviderLoginDTO,
  RegisterDTO,
} from './AuthService';
import {
  ADMIN_INVITE_CODE,
  DEFAULT_SCHOOL_NAME,
} from '../../constants/authConstants';

/**
 * ============================================================================
 * GHI CHÚ QUAN TRỌNG (CƠ CHẾ DEMO):
 * LocalAuthService là lớp triển khai mô phỏng ngoại tuyến (Offline Demo) cho ứng dụng.
 * - Danh sách tài khoản được lưu trong AsyncStorage.
 * - Mật khẩu được băm an toàn bằng SHA-256 với chuỗi muối ngẫu nhiên (salt) qua expo-crypto.
 * - Khóa phiên đăng nhập được lưu trữ an toàn bằng expo-secure-store trên thiết bị
 *   thật (hoặc fallback sang AsyncStorage khi chạy trên nền tảng Web).
 * 
 * KIẾN TRÚC MỞ RỘNG:
 * Sau này khi tích hợp Firebase, hệ thống sẽ bổ sung FirebaseAuthService kế thừa
 * cùng giao diện AuthService. Vì vậy, các màn hình UI và Zustand Store KHÔNG được
 * phụ thuộc trực tiếp vào LocalAuthService mà phải thông qua interface AuthService.
 * ============================================================================
 */

interface LocalAccountRecord {
  user: User;
  salt: string;
  passwordHash: string;
}

const STORAGE_ACCOUNTS_KEY = '@vku_local_accounts_v1';
const SESSION_TOKEN_KEY = '@vku_secure_session_token';

// Bộ avatar mặc định theo vai trò nếu người dùng không cung cấp
const DEFAULT_AVATARS = {
  student: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  lecturer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  admin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
};

export class LocalAuthService implements AuthService {
  private isInitialized = false;

  /**
   * Tạo chuỗi băm SHA-256 kèm salt ngẫu nhiên
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    const combined = `${salt}:${password}`;
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  }

  /**
   * Khởi tạo lưu trữ nội bộ
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Đọc danh sách bản ghi tài khoản hiện có
   */
  private async getAccountRecords(): Promise<LocalAccountRecord[]> {
    await this.ensureInitialized();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as LocalAccountRecord[];
    } catch {
      return [];
    }
  }

  /**
   * Lưu phiên làm việc an toàn:
   * Trên thiết bị (iOS/Android): dùng expo-secure-store
   * Trên Web: dùng AsyncStorage
   */
  private async saveSessionUserId(userId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, userId);
      } else {
        await SecureStore.setItemAsync(SESSION_TOKEN_KEY, userId);
      }
    } catch {
      // Dự phòng lưu trữ bằng AsyncStorage nếu SecureStore bị hạn chế
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, userId);
    }
  }

  /**
   * Lấy ID người dùng đang đăng nhập từ phiên lưu trữ an toàn
   */
  private async getSessionUserId(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      }
      const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
      if (token) return token;
      return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    }
  }

  /**
   * Xóa phiên làm việc khi đăng xuất
   */
  private async clearSession(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      }
    } catch {
      // Bỏ qua lỗi xóa nếu đã sạch
    } finally {
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(dto: RegisterDTO): Promise<User> {
    await this.ensureInitialized();
    const records = await this.getAccountRecords();

    // 1. Kiểm tra email trùng
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = records.find(
      (r) => r.user.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
    }

    // 2. Kiểm tra mã mời quản trị viên (nếu đăng ký admin)
    if (dto.role === 'admin') {
      const inviteCode = dto.adminInviteCode?.trim();
      if (!inviteCode || inviteCode !== ADMIN_INVITE_CODE) {
        throw new Error('Mã mời quản trị viên không chính xác. Vui lòng kiểm tra lại!');
      }
    }

    // 3. Tạo User
    const newId = `usr-${dto.role}-${Date.now()}`;
    const cleanIdentifier = dto.identifierCode.trim().toUpperCase();

    const newUser: User = {
      id: newId,
      name: dto.name.trim(),
      email: normalizedEmail,
      role: dto.role,
      schoolName: dto.schoolName?.trim() || DEFAULT_SCHOOL_NAME,
      department: dto.department,
      identifierCode: cleanIdentifier,
      code: cleanIdentifier,
      className: dto.className?.trim(),
      academicYear: dto.academicYear?.trim(),
      academicDegree: dto.academicDegree?.trim(),
      authProvider: 'email',
      avatar:
        dto.avatar ||
        DEFAULT_AVATARS[dto.role] ||
        DEFAULT_AVATARS.student,
    };

    // 4. Băm mật khẩu bằng expo-crypto (SHA-256 + salt)
    const salt = Crypto.randomUUID();
    const passwordHash = await this.hashPassword(dto.password, salt);

    const updatedRecords: LocalAccountRecord[] = [
      ...records,
      {
        user: newUser,
        salt,
        passwordHash,
      },
    ];

    await AsyncStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updatedRecords));
    await this.saveSessionUserId(newUser.id);

    return newUser;
  }

  /**
   * Đăng nhập bằng email và mật khẩu
   */
  async login(dto: LoginDTO): Promise<User> {
    await this.ensureInitialized();
    const records = await this.getAccountRecords();

    const normalizedEmail = dto.email.trim().toLowerCase();
    const foundRecord = records.find(
      (r) => r.user.email.toLowerCase() === normalizedEmail
    );

    if (!foundRecord) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    // Xác thực băm mật khẩu
    const computedHash = await this.hashPassword(dto.password, foundRecord.salt);
    if (computedHash !== foundRecord.passwordHash) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    // Lưu phiên
    await this.saveSessionUserId(foundRecord.user.id);
    return foundRecord.user;
  }

  /**
   * Đăng nhập thông qua Provider (Google / Facebook giả lập)
   */
  async loginWithProvider(dto: ProviderLoginDTO): Promise<User> {
    await this.ensureInitialized();
    const records = await this.getAccountRecords();

    const normalizedEmail = dto.mockUser.email.trim().toLowerCase();
    const existing = records.find(
      (r) => r.user.email.toLowerCase() === normalizedEmail
    );

    if (existing) {
      // Đã có tài khoản tương ứng, lưu phiên và đăng nhập
      await this.saveSessionUserId(existing.user.id);
      return existing.user;
    }

    // Nếu chưa có, tạo tài khoản mới từ tài khoản mock của Provider
    const newId = dto.mockUser.id || `usr-${dto.provider}-${Date.now()}`;
    const identifierCode =
      dto.mockUser.identifierCode ||
      (dto.mockUser.role === 'student'
        ? '22IT' + Math.floor(1000 + Math.random() * 9000)
        : 'VKU-ID' + Math.floor(100 + Math.random() * 900));

    const newUser: User = {
      id: newId,
      name: dto.mockUser.name,
      email: normalizedEmail,
      role: dto.mockUser.role,
      schoolName: DEFAULT_SCHOOL_NAME,
      department: dto.mockUser.department || 'Khoa Công nghệ Thông tin & Truyền thông',
      identifierCode,
      code: identifierCode,
      className: dto.mockUser.className,
      academicYear: dto.mockUser.academicYear,
      academicDegree: dto.mockUser.academicDegree,
      authProvider: dto.provider,
      avatar:
        dto.mockUser.avatar ||
        DEFAULT_AVATARS[dto.mockUser.role] ||
        DEFAULT_AVATARS.student,
    };

    const salt = Crypto.randomUUID();
    const passwordHash = await this.hashPassword(Crypto.randomUUID(), salt);

    const updatedRecords: LocalAccountRecord[] = [
      ...records,
      {
        user: newUser,
        salt,
        passwordHash,
      },
    ];

    await AsyncStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updatedRecords));
    await this.saveSessionUserId(newUser.id);

    return newUser;
  }

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    await this.clearSession();
  }

  /**
   * Khôi phục phiên làm việc khi người dùng mở lại app
   */
  async restoreSession(): Promise<User | null> {
    await this.ensureInitialized();
    const sessionUserId = await this.getSessionUserId();
    if (!sessionUserId) return null;

    const records = await this.getAccountRecords();
    const matched = records.find((r) => r.user.id === sessionUserId);
    return matched ? matched.user : null;
  }
}
