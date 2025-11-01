
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
const SECONDS_IN_MONTH = SECONDS_IN_DAY * 30; // Approximation
const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365; // Approximation

export const timeSince = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

  let interval = seconds / SECONDS_IN_YEAR;
  if (interval > 1) return Math.floor(interval) + "年前";

  interval = seconds / SECONDS_IN_MONTH;
  if (interval > 1) return Math.floor(interval) + "ヶ月前";

  interval = seconds / SECONDS_IN_DAY;
  if (interval > 1) return Math.floor(interval) + "日前";

  interval = seconds / SECONDS_IN_HOUR;
  if (interval > 1) return Math.floor(interval) + "時間前";

  interval = seconds / SECONDS_IN_MINUTE;
  if (interval > 1) return Math.floor(interval) + "分前";

  return Math.floor(seconds) + "秒前";
};
