import { AuthService } from './AuthService';
import { LocalAuthService } from './LocalAuthService';

export * from './AuthService';
export * from './LocalAuthService';

/**
 * Quản lý đối tượng triển khai AuthService hiện tại.
 * Mặc định sử dụng LocalAuthService (Offline Demo).
 * Sau này khi chuyển sang Firebase hoặc Mock Backend, chỉ cần gọi `setAuthService(new FirebaseAuthService())`.
 * Store và UI hoàn toàn không bị ảnh hưởng.
 */
let currentAuthService: AuthService = new LocalAuthService();

export const getAuthService = (): AuthService => {
  return currentAuthService;
};

export const setAuthService = (service: AuthService): void => {
  currentAuthService = service;
};
