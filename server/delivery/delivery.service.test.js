process.env.JWT_SECRET = 'test-secret'

jest.mock('./delivery.repository', () => ({
  createScheduledDelivery: jest.fn(),
  listDeliveriesForUser: jest.fn(),
  listPendingDeliveriesDue: jest.fn(),
}))

jest.mock('../util/randomNextWeekday', () => ({
  randomNextWeekday: jest.fn(),
}))

jest.mock('../util/chatcompletion', () => ({
  getChatCompletion: jest.fn(),
}))

jest.mock('../util/getSignedImage', () => ({
  getSignedImageUrl: jest.fn(),
}))

jest.mock('resend', () => ({
  Resend: jest.fn(),
}))

const deliveryRepository = require('./delivery.repository')
const { randomNextWeekday } = require('../util/randomNextWeekday')
const { Resend } = require('resend')
const { getChatCompletion } = require('../util/chatcompletion')
const { getSignedImageUrl } = require('../util/getSignedImage')
const deliveryService = require('./delivery.service.ts')

describe('delivery.service', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    jest.clearAllMocks()
  })

  test('scheduleRandomDelivery creates a pending delivery using the generated date', async () => {
    const scheduledFor = new Date('2026-03-16T09:00:00.000Z')
    randomNextWeekday.mockReturnValue(scheduledFor)
    deliveryRepository.createScheduledDelivery.mockResolvedValue({
      id: 1,
      userId: 7,
      scheduledFor,
      status: 'PENDING',
    })

    const result = await deliveryService.scheduleRandomDelivery(7)

    expect(randomNextWeekday).toHaveBeenCalled()
    expect(deliveryRepository.createScheduledDelivery).toHaveBeenCalledWith(7, scheduledFor)
    expect(result).toEqual({
      id: 1,
      userId: 7,
      scheduledFor,
      status: 'PENDING',
    })
  })

  test('getUsersNeedingDelivery returns distinct user ids with pending due deliveries', async () => {
    deliveryRepository.listPendingDeliveriesDue.mockResolvedValue([
      { id: 1, userId: 4, status: 'PENDING' },
      { id: 2, userId: 4, status: 'PENDING' },
      { id: 3, userId: 9, status: 'PENDING' },
    ])

    const result = await deliveryService.getUsersNeedingDelivery(new Date('2026-03-20T12:00:00.000Z'))

    expect(result).toEqual([4, 9])
  })

  test('sendTestEmail embeds the image url in the email html body', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))

    await deliveryService.sendTestEmail(
      'april@example.com',
      'A good memory.',
      'https://cloudinary.example/image.jpg',
    )

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@resend.dev',
        to: ['april@example.com'],
        html: expect.stringContaining('<img src="https://cloudinary.example/image.jpg"'),
      }),
    )
  })

  test('generateAndSendMessageEmail signs the image url before sending', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-2' }, error: null })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))
    getChatCompletion.mockResolvedValue('Remember this day.')
    getSignedImageUrl.mockReturnValue('https://cloudinary.example/signed-memory.jpg')

    const result = await deliveryService.generateAndSendMessageEmail(
      'april@example.com',
      'Beach day',
      'Sunset with friends',
      'memories/beach-day',
      'image',
    )

    expect(getSignedImageUrl).toHaveBeenCalledWith('memories/beach-day', 'image')
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://cloudinary.example/signed-memory.jpg'),
      }),
    )
    expect(result).toEqual({
      message: 'Remember this day.',
      result: { id: 'email-2' },
    })
  })
})
