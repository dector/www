const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parseDateValue(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date value: ${value}`);
  }

  const [, y, m, d, hh, mm] = match;
  return new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)),
  );
}

export function formatDisplayDate(value) {
  const date = parseDateValue(value);
  const weekday = WEEKDAYS[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${weekday}, ${day} ${month} ${year} ${hours}:${minutes}`;
}
