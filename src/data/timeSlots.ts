import { TimeSlot } from '../types';

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot_1',
    label: '07:30 - 09:30',
    startTime: '07:30',
    endTime: '09:30',
    period: 'Sáng',
  },
  {
    id: 'slot_2',
    label: '09:30 - 11:30',
    startTime: '09:30',
    endTime: '11:30',
    period: 'Sáng',
  },
  {
    id: 'slot_3',
    label: '13:00 - 15:00',
    startTime: '13:00',
    endTime: '15:00',
    period: 'Chiều',
  },
  {
    id: 'slot_4',
    label: '15:00 - 17:00',
    startTime: '15:00',
    endTime: '17:00',
    period: 'Chiều',
  },
];

export const BUILDINGS = ['ALL', 'A', 'B', 'C', 'V'] as const;

export const ALL_EQUIPMENT = [
  'Máy chiếu',
  'Bảng trắng',
  'Máy tính cấu hình cao',
  'Điều hòa',
] as const;

export const CAPACITY_OPTIONS = [
  { label: 'Tất cả', value: null },
  { label: 'Từ 2 người', value: 2 },
  { label: 'Từ 6 người', value: 6 },
  { label: 'Từ 10 người', value: 10 },
  { label: 'Từ 16 người', value: 16 },
] as const;
