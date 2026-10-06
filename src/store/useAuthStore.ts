import { create } from 'zustand';
import { User } from '../types';
import {
  AuthService,
  getAuthService,
  LoginDTO,
  ProviderLoginDTO,
  RegisterDTO,
} from '../services/auth';
import { useBookingStore } from './useBookingStore';

interface AuthStoreState {
  user: User | null;
  isLoading: boolean;
  isRestoringSession: boolean;
  error: string | null;

  // Hành động
  login: (dto: LoginDTO) => Promise<boolean>;
  register: (dto: RegisterDTO) => Promise<boolean>;
  loginWithProvider: (dto: ProviderLoginDTO) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  isRestoringSession: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (dto: LoginDTO): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authService: AuthService = getAuthService();
      const user = await authService.login(dto);
      set({ user, isLoading: false, error: null });
      useBookingStore.setState({ currentUser: user });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập không thành công. Vui lòng thử lại!';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  register: async (dto: RegisterDTO): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authService: AuthService = getAuthService();
      // Đăng ký xong tự động đăng nhập (trả về user và lưu phiên)
      const user = await authService.register(dto);
      set({ user, isLoading: false, error: null });
      useBookingStore.setState({ currentUser: user });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại. Vui lòng thử lại!';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  loginWithProvider: async (dto: ProviderLoginDTO): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authService: AuthService = getAuthService();
      const user = await authService.loginWithProvider(dto);
      set({ user, isLoading: false, error: null });
      useBookingStore.setState({ currentUser: user });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Đăng nhập liên kết không thành công. Vui lòng thử lại!';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const authService: AuthService = getAuthService();
      await authService.logout();
    } catch {
      // Bỏ qua lỗi xóa phiên nếu có
    } finally {
      set({ user: null, isLoading: false, error: null });
    }
  },

  restoreSession: async (): Promise<void> => {
    set({ isRestoringSession: true });
    try {
      const authService: AuthService = getAuthService();
      const user = await authService.restoreSession();
      if (user) {
        set({ user, isRestoringSession: false });
        useBookingStore.setState({ currentUser: user });
      } else {
        set({ user: null, isRestoringSession: false });
      }
    } catch {
      set({ user: null, isRestoringSession: false });
    }
  },
}));
