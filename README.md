# Ứng Dụng Đặt Phòng Học VKU (VKU Room Booking)

> Ứng dụng di động quản lý và đặt phòng học thông minh dành cho sinh viên, giảng viên và cán bộ quản trị Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU).

---

## 🌟 Công Nghệ Sử Dụng

- **Framework:** Expo SDK 57 (Expo Go compatible, Continuous Native Generation)
- **Core:** React Native 0.86.3, React 19.2.3, TypeScript (Strict Mode)
- **Điều hướng (Navigation):** React Navigation v7 (Native Stack + Bottom Tabs)
- **Quản lý trạng thái (State Management):** Zustand v5 (Persist AsyncStorage)
- **Data Fetching & Server Cache:** TanStack React Query v5
- **Xác thực & Cơ sở dữ liệu Cloud:** Firebase JS SDK v12 (Firebase Authentication + Cloud Firestore)
- **UI & Hiệu ứng:** React Native Reanimated v4, Expo Haptics, Expo Vector Icons

---

## 🔄 Kiến Trúc Chế Độ Kép (Dual-Mode Architecture)

Hệ thống được thiết kế theo mô hình **Dependency Inversion** với giao diện chuẩn `AuthService`. Ứng dụng hỗ trợ 2 chế độ hoạt động song song mượt mà:

1. **🔥 Chế độ Firebase Cloud (Trực tuyến):**
   - Khi có đầy đủ biến môi trường `EXPO_PUBLIC_FIREBASE_*` trong `.env`.
   - Sử dụng `FirebaseAuthService`: Đăng ký, đăng nhập, khôi phục phiên qua Firebase Authentication; hồ sơ người dùng lưu tại Cloud Firestore collection `users/{uid}`.
   - Khôi phục phiên tự động bằng `AsyncStorage` (trên di động) và `browserLocalPersistence` (trên web).
   - Cơ chế tự động dọn dẹp (Rollback): Nếu lưu Firestore thất bại sau khi tạo Auth, hệ thống tự động xóa user Auth mồ côi để đảm bảo toàn vẹn dữ liệu.

2. **📱 Chế độ Demo / Ngoại tuyến (Offline Fallback):**
   - Khi chưa cấu hình `.env` hoặc tải dự án về chạy thử mà không có API key.
   - Tự động fallback về `LocalAuthService`: Băm mật khẩu an toàn bằng SHA-256 kèm salt qua `expo-crypto`, lưu trữ AsyncStorage.
   - Giao diện hiển thị huy hiệu nhỏ **"Chế độ demo/offline"**, đảm bảo dự án chạy ổn định 100% ngay sau khi clone mà không gặp lỗi thiếu cấu hình.

---

## 🛠️ Hướng Dẫn Tích Hợp Firebase (Chi Tiết Từng Bước)

### Bước 1: Tạo dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn **Add project** (Thêm dự án), đặt tên dự án (ví dụ: `vku-room-booking`).
3. Tắt Google Analytics (không bắt buộc) và nhấn **Create project**.

### Bước 2: Đăng ký Web App và lấy khóa cấu hình
1. Tại trang **Project Overview**, bấm vào biểu tượng Web (`</>`).
2. Đặt App nickname (ví dụ: `vku-booking-web`), bỏ chọn *Firebase Hosting*, rồi nhấn **Register app**.
3. Firebase sẽ hiển thị đoạn mã `firebaseConfig`. Sao chép các thông số tương ứng:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Bước 3: Kích hoạt Firebase Authentication (Email/Password & Google)
1. Trên menu bên trái, chọn **Build** > **Authentication**.
2. Nhấn **Get started**.
3. Tại tab **Sign-in method**, chọn **Email/Password**:
   - Bật công tắc **Email/Password** (không cần bật Email link), sau đó nhấn **Save**.
4. Tiếp tục tại tab **Sign-in method**, thêm nhà cung cấp **Google**:
   - Nhấn **Add new provider** > chọn **Google**.
   - Bật công tắc **Enable**.
   - Chọn **Project support email** (email quản trị dự án).
   - Nhấn **Save**.
5. **Kiểm tra Authorized domains (Tên miền được cấp phép):**
   - Chuyển sang tab **Settings** trong Authentication > cuộn xuống mục **Authorized domains**.
   - Mặc định Firebase đã cấp phép `localhost` và `<project-id>.firebaseapp.com`.
   - Đảm bảo `localhost` có trong danh sách để đăng nhập popup Google hoạt động trơn tru trên môi trường dev Web (`http://localhost:8081`). Nếu chạy bằng domain khác hoặc IP mạng LAN, hãy nhấn **Add domain** để thêm vào.

### Bước 4: Tạo Cloud Firestore Database
1. Trên menu bên trái, chọn **Build** > **Firestore Database**.
2. Nhấn **Create database**.
3. Chọn vị trí lưu trữ máy chủ (khuyến nghị: `asia-southeast1` - Singapore hoặc vị trí gần Việt Nam).
4. Chọn chế độ bảo mật **Start in production mode** (hoặc test mode), nhấn **Next** và hoàn tất.

### Bước 5: Cấu hình biến môi trường `.env`
1. Tại thư mục gốc của dự án, sao chép file `.env.example` thành file `.env`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và điền các giá trị từ Bước 2:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=vku-room-booking-xxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=vku-room-booking-xxxx
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=vku-room-booking-xxxx.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:xxxxxx
   ```
   > ⚠️ **LƯU Ý:** File `.env` đã được cấu hình trong `.gitignore`. Tuyệt đối không commit file `.env` lên GitHub để bảo vệ thông tin dự án.

### Bước 6: Cài đặt Firestore Security Rules
1. Mở file [firestore.rules](file:///d:/danentang/vku-room-booking/firestore.rules) trong thư mục gốc dự án và sao chép toàn bộ nội dung.
2. Trên Firebase Console, vào **Firestore Database** > chuyển sang tab **Rules**.
3. Dán toàn bộ nội dung quy tắc bảo mật vào và nhấn **Publish**.

*Quy tắc bảo mật đảm bảo:*
- Mỗi người dùng chỉ đọc và ghi được hồ sơ `users/{userId}` của chính mình.
- Client tuyệt đối **không được tự tạo hoặc tự cấp vai trò `admin`**.
- Mọi collection khác đều mặc định từ chối truy cập.

---

## 👑 Hướng Dẫn Tạo Tài Khoản Quản Trị Viên (Admin) Thủ Công

Vì lý do bảo mật, ứng dụng chặn không cho phép người dùng tự đăng ký vai trò Quản trị viên từ giao diện. Để tạo tài khoản Admin phục vụ demo và chấm điểm:

### 1. Tạo tài khoản trên Authentication:
1. Vào Firebase Console > **Authentication** > tab **Users**.
2. Nhấn **Add user**.
3. Nhập:
   - **Email:** `admin@vku.udn.vn`
   - **Password:** `<Mật khẩu quản trị viên tự chọn>`
4. Nhấn **Add user**. Sau đó sao chép chuỗi **User UID** của tài khoản vừa tạo.

### 2. Tạo hồ sơ trên Cloud Firestore:
1. Vào Firebase Console > **Firestore Database** > tab **Data**.
2. Nhấn **Start collection** (nếu chưa có):
   - Collection ID: `users`
   - Document ID: Dán chính xác chuỗi **User UID** vừa sao chép ở trên.
3. Thêm các trường dữ liệu sau (đúng kiểu dữ liệu):
   - `uid` *(string)*: `<User UID>`
   - `name` *(string)*: `Quản trị viên VKU`
   - `email` *(string)*: `admin@vku.udn.vn`
   - `role` *(string)*: `admin`  *(Bắt buộc)*
   - `schoolName` *(string)*: `Trường ĐH Công nghệ Thông tin & TT Việt - Hàn (VKU)`
   - `department` *(string)*: `Phòng Hành chính - Tổ chức`
   - `identifierCode` *(string)*: `VKU-CB001`
   - `code` *(string)*: `VKU-CB001`
   - `authProvider` *(string)*: `email`
   - `avatar` *(string)*: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80`
   - `createdAt` *(string)*: `2026-10-06T00:00:00.000Z`
4. Nhấn **Save**. Tài khoản Quản trị viên đã sẵn sàng sử dụng.

---

## 🚀 Khởi Chạy Và Kiểm Thử

### 1. Cài đặt và chạy ứng dụng:
```bash
# Cài đặt thư viện
npm install

# Kiểm tra TypeScript
npx tsc --noEmit

# Khởi chạy Metro Bundler
npx expo start
# Hoặc chế độ tunnel nếu điện thoại khác mạng Wi-Fi:
npx expo start --tunnel -c
```

### 2. Kiểm thử trên Trình duyệt Web (Khung 390px):
1. Nhấn phím `w` trong terminal hoặc truy cập `http://localhost:8081`.
2. Mở Công cụ phát triển trình duyệt (F12) > Bật chế độ Responsive Device Toolbar > Chọn thiết bị **iPhone 12/13/14/15 Pro (390 x 844)**.
3. Quan sát và kiểm tra xác thực:
   - Huy hiệu `Chế độ: Firebase Cloud` (hoặc `Chế độ demo/offline`) hiển thị rõ ràng trên màn hình.
   - **Đăng nhập Quản trị viên:** Nhập email `admin@vku.udn.vn` và mật khẩu đã tạo trên Firebase Console trực tiếp qua form Đăng nhập (không dùng nút demo).
   - **Đăng ký tài khoản mới:**
     - Nhấn "Đăng ký ngay", điền thông tin và nhấn "Đăng ký tài khoản".
     - Hệ thống **không tự đăng nhập** mà chuyển hướng trở lại màn hình Đăng nhập.
     - Email vừa đăng ký được điền sẵn, mật khẩu để trống, kèm thông báo thành công màu xanh lá: *"Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."*
   - **Đăng nhập Google thật (Chỉ nền tảng Web):**
     - Nhấn nút biểu tượng **Google**. Cửa sổ popup Google sẽ xuất hiện.
     - Chọn tài khoản Google để đăng nhập. Khi thành công, ứng dụng tự động chuyển vào màn hình chính.
     - Nếu là lần đầu tiên đăng nhập, hệ thống tự động khởi tạo hồ sơ sinh viên (`role: 'student'`) trên Cloud Firestore.
     - Nếu tài khoản đã tồn tại trên Firestore (kể cả đã được nâng quyền admin), hệ thống giữ nguyên vai trò cũ.

### 3. Kiểm thử trên iPhone (iOS) & Android:
1. Mở ứng dụng **Expo Go** trên điện thoại.
2. Quét mã QR hiển thị trong terminal.
3. Khi nhấn nút Google trên điện thoại, hệ thống sẽ hiển thị thông báo rõ ràng: *"Đăng nhập Google hiện chỉ hỗ trợ trên web. Vui lòng đăng nhập bằng Email trường và Mật khẩu."*
4. Trải nghiệm hiệu ứng mượt mà: Animation thẻ phòng, chọn slot đặt phòng, chuông thông báo, phản hồi rung Haptics, và xác thực Firebase Auth được lưu phiên liên tục khi khởi động lại app.
