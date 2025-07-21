import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = dayjs(start);
  const last = dayjs(end);

  while (current.isSameOrBefore(last)) {
    dates.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }

  return dates;
}
