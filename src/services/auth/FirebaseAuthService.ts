import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../../types';
import {
  AuthService,
  LoginDTO,
  ProviderLoginDTO,
  RegisterDTO,
} from './AuthService';
import { DEFAULT_SCHOOL_NAME, getRoleLabel } from '../../constants/authConstants';
import { getFirebaseAuth, getFirestoreDb } from '../firebase';

// Bộ avatar mặc định theo vai trò nếu người dùng không cung cấp
const DEFAULT_AVATARS: Record<UserRole, string> = {
  student:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  lecturer:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  admin:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
};

/**
 * Chuyển đổi mã lỗi Firebase Authentication & Firestore sang thông điệp tiếng Việt thân thiện
 */
export const translateFirebaseError = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'Đã có lỗi xảy ra. Vui lòng thử lại!';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Địa chỉ email trường không hợp lệ hoặc sai định dạng.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ ban quản trị.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản khác. Vui lòng đăng nhập.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Mật khẩu phải có tối thiểu 6-8 ký tự.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử sai quá nhiều lần. Vui lòng tạm đợi vài phút rồi thử lại.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Password chưa được kích hoạt trong Firebase Console.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup để đăng nhập Google.';
    case 'auth/cancelled-popup-request':
      return 'Yêu cầu mở cửa sổ đăng nhập đã bị hủy.';
    case 'auth/account-exists-with-different-credential':
      return 'Tài khoản đã tồn tại với một phương thức đăng nhập khác. Vui lòng đăng nhập bằng Email/Password.';
    case 'auth/unauthorized-domain':
      return 'Tên miền chưa được cấp phép trong Firebase Console. Vui lòng kiểm tra Authorized domains.';
    case 'permission-denied':
      return 'Từ chối quyền truy cập dữ liệu (Firestore Rules). Vui lòng kiểm tra quyền hạn.';
    case 'unavailable':
      return 'Dịch vụ máy chủ Firebase tạm thời không phản hồi. Vui lòng thử lại sau.';
    default:
      if (err.message && err.message.length > 0) {
        return err.message;
      }
      return 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại!';
  }
};

/**
 * Lớp triển khai AuthService sử dụng Firebase Authentication và Cloud Firestore (Web JS SDK v9-v12).
 * Hoạt động mượt mà trên Expo Go (iOS, Android) và Web.
 */
export class FirebaseAuthService implements AuthService {
  private isRegistering = false;

  private getAuthInstance() {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        'Firebase Auth chưa được khởi tạo. Vui lòng kiểm tra biến môi trường EXPO_PUBLIC_FIREBASE_* trong .env.'
      );
    }
    return auth;
  }

  private getFirestoreInstance() {
    const db = getFirestoreDb();
    if (!db) {
      throw new Error(
        'Cloud Firestore chưa được khởi tạo. Vui lòng kiểm tra biến môi trường EXPO_PUBLIC_FIREBASE_* trong .env.'
      );
    }
    return db;
  }

  /**
   * Đăng ký tài khoản người dùng mới:
   * 1. Kiểm tra quyền admin: client TUYỆT ĐỐI không được tự tạo tài khoản vai trò admin.
   * 2. Tạo tài khoản trong Firebase Authentication (createUserWithEmailAndPassword).
   * 3. Lưu hồ sơ người dùng vào Firestore collection 'users' với ID là uid.
   * 4. Nếu lưu Firestore bị lỗi, tự động xóa (rollback) tài khoản Auth vừa tạo để tránh mồ côi.
   * 5. Sau khi lưu thành công, lập tức gọi signOut() để không tự động đăng nhập vào app.
   */
  async register(dto: RegisterDTO): Promise<User> {
    // Ràng buộc bảo mật: Chế độ Firebase không cho client tự cấp quyền admin
    if (dto.role === 'admin') {
      throw new Error(
        'Chế độ Firebase không cho phép tự đăng ký quyền Quản trị viên từ ứng dụng. Tài khoản Admin chỉ được tạo và gán quyền trực tiếp trên Firebase Console.'
      );
    }

    const auth = this.getAuthInstance();
    const db = this.getFirestoreInstance();

    const normalizedEmail = dto.email.trim().toLowerCase();
    const cleanIdentifier = dto.identifierCode.trim().toUpperCase();
    const assignedAvatar =
      dto.avatar || DEFAULT_AVATARS[dto.role] || DEFAULT_AVATARS.student;

    this.isRegistering = true;
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        dto.password
      );

      const uid = userCredential.user.uid;

      // Cập nhật tên hiển thị trên Auth profile
      try {
        await updateProfile(userCredential.user, {
          displayName: dto.name.trim(),
        });
      } catch {
        // Tiếp tục nếu cập nhật display name không thành công
      }

      // Chuẩn bị dữ liệu hồ sơ Firestore theo đúng đặc tả
      const profileData = {
        uid,
        name: dto.name.trim(),
        email: normalizedEmail,
        role: dto.role,
        schoolName: dto.schoolName?.trim() || DEFAULT_SCHOOL_NAME,
        department: dto.department,
        identifierCode: cleanIdentifier,
        code: cleanIdentifier,
        className: dto.role === 'student' ? dto.className?.trim() || '' : '',
        academicYear: dto.role === 'student' ? dto.academicYear?.trim() || '' : '',
        academicDegree: dto.role === 'lecturer' ? dto.academicDegree?.trim() || '' : '',
        authProvider: 'email',
        avatar: assignedAvatar,
        createdAt: new Date().toISOString(),
      };

      // Ghi hồ sơ vào Firestore users/{uid}
      try {
        await setDoc(doc(db, 'users', uid), profileData);
      } catch (firestoreErr) {
        // NGUY CƠ: Nếu ghi Firestore thất bại, tài khoản Auth sẽ bị mồ côi (không có hồ sơ)
        // XỬ LÝ: Tự động rollback tài khoản Auth và thông báo lỗi rõ ràng
        try {
          await deleteUser(userCredential.user);
        } catch (deleteErr) {
          console.warn('[FirebaseAuthService] Không thể xóa user mồ côi sau lỗi Firestore:', deleteErr);
        }

        throw new Error(
          `Lỗi khi lưu hồ sơ người dùng vào Firestore: ${translateFirebaseError(
            firestoreErr
          )}. Tài khoản chưa được tạo hoàn tất, vui lòng thử lại!`
        );
      }

      // ĐĂNG KÝ XONG KHÔNG TỰ ĐĂNG NHẬP:
      // createUserWithEmailAndPassword tự động đăng nhập, nên ta lập tức gọi signOut()
      // để trả về màn hình Đăng nhập theo đúng quy trình
      try {
        await signOut(auth);
      } catch (signOutErr) {
        console.warn('[FirebaseAuthService] Lỗi signOut sau khi đăng ký:', signOutErr);
      }

      return {
        id: uid,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        schoolName: profileData.schoolName,
        department: profileData.department,
        identifierCode: profileData.identifierCode,
        code: profileData.code,
        className: profileData.className || undefined,
        academicYear: profileData.academicYear || undefined,
        academicDegree: profileData.academicDegree || undefined,
        authProvider: 'email',
        avatar: profileData.avatar,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(translateFirebaseError(err));
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * Đăng nhập bằng Email và Mật khẩu:
   * 1. Xác thực qua signInWithEmailAndPassword.
   * 2. Đọc hồ sơ người dùng từ Firestore users/{uid}.
   */
  async login(dto: LoginDTO): Promise<User> {
    const auth = this.getAuthInstance();
    const db = this.getFirestoreInstance();

    const normalizedEmail = dto.email.trim().toLowerCase();

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        dto.password
      );
    } catch (err) {
      throw new Error(translateFirebaseError(err));
    }

    const uid = userCredential.user.uid;

    // Đọc hồ sơ chi tiết từ Firestore users/{uid}
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) {
        try {
          await signOut(auth);
        } catch {}
        throw new Error(
          'Tài khoản này chưa có dữ liệu hồ sơ trong Firestore. Vui lòng liên hệ Quản trị viên để kiểm tra collection users.'
        );
      }

      const data = snap.data();
      const role: UserRole = (data.role as UserRole) || 'student';

      // Đối chiếu vai trò: Nếu profile.role khác vai trò đã chọn thì gọi signOut() và báo lỗi
      if (dto.selectedRole && role !== dto.selectedRole) {
        try {
          await signOut(auth);
        } catch {}
        throw new Error(
          `Tài khoản này thuộc vai trò ${getRoleLabel(role)}. Vui lòng chọn đúng vai trò để đăng nhập.`
        );
      }

      return {
        id: uid,
        name: data.name || userCredential.user.displayName || 'Người dùng VKU',
        email: data.email || userCredential.user.email || normalizedEmail,
        role,
        schoolName: data.schoolName || DEFAULT_SCHOOL_NAME,
        department: data.department || '',
        identifierCode: data.identifierCode || data.code || '',
        code: data.identifierCode || data.code || '',
        className: data.className || undefined,
        academicYear: data.academicYear || undefined,
        academicDegree: data.academicDegree || undefined,
        authProvider: (data.authProvider as any) || 'email',
        avatar: data.avatar || DEFAULT_AVATARS[role] || DEFAULT_AVATARS.student,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes('chưa có dữ liệu hồ sơ') ||
          err.message.includes('Tài khoản này thuộc vai trò')
        ) {
          throw err;
        }
      }
      try {
        await signOut(auth);
      } catch {}
      throw new Error(
        `Lỗi khi tải hồ sơ từ Firestore: ${translateFirebaseError(err)}`
      );
    }
  }

  /**
   * Đăng nhập thông qua Google / Facebook:
   * - Google (trên Web): Gọi signInWithPopup và GoogleAuthProvider từ Firebase JS SDK.
   *   Nếu là lần đầu: Người dùng chọn Sinh viên hoặc Giảng viên thì tạo hồ sơ tương ứng.
   *   Nếu chọn Quản trị viên mà chưa có hồ sơ thì từ chối báo "Tài khoản Quản trị viên chỉ được cấp qua console".
   *   Nếu đã có hồ sơ: Đối chiếu vai trò đã chọn với profile.role, nếu sai thì signOut() và báo lỗi.
   * - Google (trên iOS / Android): Báo lỗi chỉ hỗ trợ trên web.
   * - Facebook: Giữ luồng mô phỏng SSO kèm đối chiếu vai trò.
   */
  async loginWithProvider(dto: ProviderLoginDTO): Promise<User> {
    if (dto.provider === 'google') {
      if (Platform.OS !== 'web') {
        throw new Error('Đăng nhập Google hiện chỉ hỗ trợ trên web. Vui lòng đăng nhập bằng Email và Mật khẩu.');
      }

      const auth = this.getAuthInstance();
      const db = this.getFirestoreInstance();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      let userCredential;
      try {
        userCredential = await signInWithPopup(
          auth,
          provider,
          browserPopupRedirectResolver
        );
      } catch (err) {
        throw new Error(translateFirebaseError(err));
      }

      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;

      // Đọc hồ sơ từ Firestore users/{uid}
      const userDocRef = doc(db, 'users', uid);
      let snap;
      try {
        snap = await getDoc(userDocRef);
      } catch (fsErr) {
        try {
          await signOut(auth);
        } catch {}
        throw new Error(`Lỗi kiểm tra hồ sơ Firestore: ${translateFirebaseError(fsErr)}`);
      }

      if (snap.exists()) {
        // Đã có hồ sơ -> giữ nguyên role và thông tin, không ghi đè
        const data = snap.data();
        const role: UserRole = (data.role as UserRole) || 'student';

        // Đối chiếu vai trò: Nếu profile.role khác vai trò đã chọn thì gọi signOut() và báo lỗi
        if (dto.selectedRole && role !== dto.selectedRole) {
          try {
            await signOut(auth);
          } catch {}
          throw new Error(
            `Tài khoản này thuộc vai trò ${getRoleLabel(role)}. Vui lòng chọn đúng vai trò để đăng nhập.`
          );
        }

        return {
          id: uid,
          name: data.name || firebaseUser.displayName || 'Người dùng Google',
          email: data.email || firebaseUser.email || '',
          role,
          schoolName: data.schoolName || DEFAULT_SCHOOL_NAME,
          department: data.department || '',
          identifierCode: data.identifierCode || data.code || '',
          code: data.identifierCode || data.code || '',
          className: data.className || undefined,
          academicYear: data.academicYear || undefined,
          academicDegree: data.academicDegree || undefined,
          authProvider: 'google',
          avatar: data.avatar || firebaseUser.photoURL || DEFAULT_AVATARS[role],
        };
      } else {
        // Chưa có hồ sơ (lần đầu đăng nhập Google)
        // Nếu đang chọn "Quản trị viên" mà chưa có hồ sơ thì từ chối
        if (dto.selectedRole === 'admin') {
          try {
            await signOut(auth);
          } catch {}
          throw new Error('Tài khoản Quản trị viên chỉ được cấp qua console');
        }

        // Người dùng lần đầu chọn Sinh viên hoặc Giảng viên thì tạo hồ sơ với đúng vai trò đó
        const assignedRole: UserRole =
          dto.selectedRole === 'lecturer' ? 'lecturer' : 'student';

        const defaultCode =
          assignedRole === 'lecturer'
            ? 'VKU-GV-' + uid.substring(0, 6).toUpperCase()
            : 'VKU-G' + uid.substring(0, 6).toUpperCase();

        const defaultName =
          firebaseUser.displayName?.trim() ||
          (assignedRole === 'lecturer' ? 'Giảng viên VKU' : 'Sinh viên VKU');

        const newProfile = {
          uid,
          name: defaultName,
          email: firebaseUser.email?.trim().toLowerCase() || '',
          role: assignedRole,
          schoolName: DEFAULT_SCHOOL_NAME,
          department: 'Khoa Công nghệ Thông tin & Truyền thông',
          identifierCode: defaultCode,
          code: defaultCode,
          className: '',
          academicYear: '',
          academicDegree: assignedRole === 'lecturer' ? 'Thạc sĩ' : '',
          authProvider: 'google',
          avatar: firebaseUser.photoURL || DEFAULT_AVATARS[assignedRole],
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, newProfile);
        } catch (fsCreateErr) {
          try {
            await signOut(auth);
          } catch {}
          throw new Error(
            `Lỗi tạo hồ sơ người dùng trên Firestore: ${translateFirebaseError(
              fsCreateErr
            )}. Vui lòng thử lại!`
          );
        }

        return {
          id: uid,
          name: newProfile.name,
          email: newProfile.email,
          role: assignedRole,
          schoolName: newProfile.schoolName,
          department: newProfile.department,
          identifierCode: newProfile.identifierCode,
          code: newProfile.code,
          authProvider: 'google',
          avatar: newProfile.avatar,
        };
      }
    }

    // Luồng giả lập SSO cho Facebook
    const role = dto.mockUser.role;
    if (dto.selectedRole && role !== dto.selectedRole) {
      throw new Error(
        `Tài khoản này thuộc vai trò ${getRoleLabel(role)}. Vui lòng chọn đúng vai trò để đăng nhập.`
      );
    }
    const identifierCode =
      dto.mockUser.identifierCode ||
      (role === 'student' ? '21IT2907' : role === 'lecturer' ? 'VKU-GV1024' : 'VKU-CB001');

    return {
      id: dto.mockUser.id || `usr-${dto.provider}-${Date.now()}`,
      name: dto.mockUser.name,
      email: dto.mockUser.email,
      role,
      schoolName: DEFAULT_SCHOOL_NAME,
      department: dto.mockUser.department || 'Khoa Công nghệ Thông tin & Truyền thông',
      identifierCode,
      code: identifierCode,
      className: dto.mockUser.className,
      academicYear: dto.mockUser.academicYear,
      academicDegree: dto.mockUser.academicDegree,
      authProvider: dto.provider,
      avatar:
        dto.mockUser.avatar || DEFAULT_AVATARS[role] || DEFAULT_AVATARS.student,
    };
  }

  /**
   * Đăng xuất khỏi Firebase Auth
   */
  async logout(): Promise<void> {
    const auth = this.getAuthInstance();
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[FirebaseAuthService] Lỗi khi signOut:', err);
    }
  }

  /**
   * Khôi phục phiên làm việc:
   * Lắng nghe onAuthStateChanged, nếu đã có phiên thì đọc hồ sơ Firestore users/{uid}.
   */
  async restoreSession(): Promise<User | null> {
    if (this.isRegistering) {
      return null;
    }

    const auth = this.getAuthInstance();
    const db = this.getFirestoreInstance();

    return new Promise<User | null>((resolve) => {
      // Thiết lập timeout 5s đề phòng trường hợp mất mạng khi mở app
      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          unsubscribe();
          clearTimeout(timeout);

          if (!firebaseUser || this.isRegistering) {
            resolve(null);
            return;
          }

          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (!snap.exists()) {
              resolve(null);
              return;
            }

            const data = snap.data();
            const role: UserRole = (data.role as UserRole) || 'student';

            resolve({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Người dùng VKU',
              email: data.email || firebaseUser.email || '',
              role,
              schoolName: data.schoolName || DEFAULT_SCHOOL_NAME,
              department: data.department || '',
              identifierCode: data.identifierCode || data.code || '',
              code: data.identifierCode || data.code || '',
              className: data.className || undefined,
              academicYear: data.academicYear || undefined,
              academicDegree: data.academicDegree || undefined,
              authProvider: 'email',
              avatar: data.avatar || DEFAULT_AVATARS[role] || DEFAULT_AVATARS.student,
            });
          } catch (err) {
            console.warn('[FirebaseAuthService] Lỗi khi khôi phục hồ sơ:', err);
            resolve(null);
          }
        },
        (error) => {
          clearTimeout(timeout);
          console.warn('[FirebaseAuthService] Lỗi onAuthStateChanged:', error);
          resolve(null);
        }
      );
    });
  }
}
