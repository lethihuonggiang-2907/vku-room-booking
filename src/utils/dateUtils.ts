export interface DayOption {
  date: string;       // YYYY-MM-DD
  dayOfWeek: string;  // T2, T3, T4, T5, T6, T7, CN
  dayName: string;    // Thứ Hai, Thứ Ba...
  dayNumber: string;  // 04, 05...
  monthNumber: string;// 10...
  isToday: boolean;
  formatted: string;  // 04/10
}

export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(new Date());
}

export function getNext7Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  const dayNamesShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayNamesFull = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(d);
    const dayIndex = d.getDay();
    const dayNumber = String(d.getDate()).padStart(2, '0');
    const monthNumber = String(d.getMonth() + 1).padStart(2, '0');

    days.push({
      date: dateStr,
      dayOfWeek: i === 0 ? 'H.nay' : dayNamesShort[dayIndex],
      dayName: i === 0 ? 'Hôm nay' : dayNamesFull[dayIndex],
      dayNumber,
      monthNumber,
      isToday: i === 0,
      formatted: `${dayNumber}/${monthNumber}`,
    });
  }

  return days;
}

export function formatDateVietnamese(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const dayNamesFull = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const dayName = dayNamesFull[d.getDay()];
  return `${dayName}, ${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
}

/**
 * Kiểm tra xem một khung giờ đã qua so với thời gian hiện tại hay chưa
 * (Chỉ áp dụng khi ngày được chọn là hôm nay)
 */
export function isSlotPassed(dateStr: string, slotStartTime: string): boolean {
  const todayStr = getTodayDateString();
  if (dateStr < todayStr) {
    return true; // Ngày trong quá khứ đã qua
  }
  if (dateStr > todayStr) {
    return false; // Ngày tương lai thì chưa qua
  }

  // Ngày là hôm nay -> so sánh giờ
  const now = new Date();
  const [startHour, startMin] = slotStartTime.split(':').map((v) => parseInt(v, 10));
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  if (currentHour > startHour) return true;
  if (currentHour === startHour && currentMin >= startMin) return true;
  return false;
}

/**
 * Sinh mã đặt chỗ ngẫu nhiên duy nhất
 */
export function generateBookingCode(roomCode: string): string {
  const cleanCode = roomCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `VKU-${cleanCode}-${randomNum}`;
}
