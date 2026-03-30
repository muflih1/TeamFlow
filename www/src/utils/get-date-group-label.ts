import {format, isSameWeek, isSameYear, isToday, isYesterday} from 'date-fns';

export function getDateGroupLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isSameWeek(date, now, {weekStartsOn: 1})) {
    return format(date, 'EEEE');
  }
  if (isSameYear(date, now)) {
    return format(date, 'EEEE, MMMM d');
  }
  return format(date, 'EEEE, MMMM d, yyyy');
}
