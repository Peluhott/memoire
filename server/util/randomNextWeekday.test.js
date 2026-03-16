const { randomNextWeekday } = require('./randomNextWeekday.ts')

describe('randomNextWeekday', () => {
  test('returns a date on the next week between monday and friday', () => {
    const fromDate = new Date('2026-03-14T12:00:00.000Z') // Saturday
    const result = randomNextWeekday(fromDate)

    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString().slice(0, 10) >= '2026-03-16').toBe(true)
    expect(result.toISOString().slice(0, 10) <= '2026-03-20').toBe(true)
    expect(result.getUTCDay()).toBeGreaterThanOrEqual(1)
    expect(result.getUTCDay()).toBeLessThanOrEqual(5)
  })
})
