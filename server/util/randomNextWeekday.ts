export function randomNextWeekday(fromDate = new Date()) {
  const baseDate = new Date(fromDate);
  const day = baseDate.getDay();
  const daysUntilNextMonday = (8 - day) % 7 || 7;

  const nextMonday = new Date(baseDate);
  nextMonday.setDate(baseDate.getDate() + daysUntilNextMonday);
  nextMonday.setHours(9, 0, 0, 0);

  const randomOffset = Math.floor(Math.random() * 5);
  const randomWeekday = new Date(nextMonday);
  randomWeekday.setDate(nextMonday.getDate() + randomOffset);

  return randomWeekday;
}

export default randomNextWeekday;
