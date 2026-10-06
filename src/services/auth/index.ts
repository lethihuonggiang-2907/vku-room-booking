import { AuthService } from './AuthService';
import { LocalAuthService } from './LocalAuthService';
import { FirebaseAuthService } from './FirebaseAuthService';
import { isFirebaseConfigured } from '../firebase';

export * from './AuthService';
export * from './LocalAuthService';
export * from './FirebaseAuthService';

/**
 * Kiểm tra xem AuthService hiện đang chạy ở chế độ Firebase hay Chế độ cục bộ (Offline Demo).
 */
export const isAuthFirebaseMode = (): boolean => {
  return isFirebaseConfigured();
};

/**
 * Quản lý đối tượng triển khai AuthService hiện tại.
 * - Nếu cấu hình Firebase trong .env đầy đủ: tự động sử dụng FirebaseAuthService.
 * - Nếu thiếu biến môi trường hoặc chạy offline: tự động fallback về LocalAuthService (Offline Demo)
 *   kèm ghi chú "Chế độ demo/offline", giúp repo vẫn chạy bình thường khi người khác tải về không có khóa.
 */
let currentAuthService: AuthService = isFirebaseConfigured()
  ? new FirebaseAuthService()
  : new LocalAuthService();

export const getAuthService = (): AuthService => {
  return currentAuthService;
};

export const setAuthService = (service: AuthService): void => {
  currentAuthService = service;
};
