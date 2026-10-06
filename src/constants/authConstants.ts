import { UserRole } from '../types';

export const DEFAULT_SCHOOL_NAME = 'Trường ĐH CNTT & TT Việt - Hàn';
export const DEFAULT_EMAIL_DOMAIN = '@vku.udn.vn';
export const ADMIN_INVITE_CODE = 'VKU-ADMIN-2026';

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Sinh viên',
  lecturer: 'Giảng viên',
  admin: 'Quản trị viên',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  student: 'Đặt phòng học nhóm, phòng Lab thực hành và tham gia hoạt động học thuật',
  lecturer: 'Đặt giảng đường, phòng hội thảo và phòng nghiên cứu chuyên đề',
  admin: 'Quản lý toàn bộ lịch đặt phòng học, giám sát và điều phối hạ tầng cơ sở',
};

export const VKU_DEPARTMENTS = [
  'Khoa Công nghệ Thông tin & Truyền thông',
  'Khoa Khoa học Máy tính',
  'Khoa Kỹ thuật Máy tính & Điện tử',
  'Khoa Kinh tế số & Thương mại điện tử',
  'Phòng Đào tạo',
  'Phòng Công tác Sinh viên',
  'Phòng Khảo thí & Đảm bảo chất lượng giáo dục',
  'Phòng Khoa học Công nghệ & Hợp tác Quốc tế',
  'Phòng Hành chính - Tổ chức',
  'Trung tâm Học liệu & Truyền thông',
] as const;

export const ACADEMIC_DEGREES = [
  'Cử nhân',
  'Kỹ sư',
  'Thạc sĩ',
  'Tiến sĩ',
  'Phó Giáo sư',
  'Giáo sư',
] as const;

export const ACADEMIC_YEARS = [
  '2021 - 2026',
  '2022 - 2027',
  '2023 - 2028',
  '2024 - 2029',
  '2025 - 2030',
] as const;

export const getRoleLabel = (role: UserRole | string): string => {
  if (role === 'student' || role === 'Sinh viên') return 'Sinh viên';
  if (role === 'lecturer' || role === 'Giảng viên') return 'Giảng viên';
  if (role === 'admin' || role === 'Quản trị viên') return 'Quản trị viên';
  return role;
};
