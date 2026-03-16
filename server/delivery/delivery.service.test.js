process.env.JWT_SECRET = 'test-secret'

jest.mock('./delivery.repository', () => ({
  createScheduledDelivery: jest.fn(),
  getCurrentPendingDeliveryForUser: jest.fn(),
  listDeliveriesForUser: jest.fn(),
  listPendingDeliveriesDue: jest.fn(),
  listSentDeliveriesForUser: jest.fn(),
  markDeliveryInactive: jest.fn(),
  markDeliverySent: jest.fn(),
  markDeliveryFailed: jest.fn(),
}))

jest.mock('../content/content.service', () => ({
  listContentSummariesByUser: jest.fn(),
  listAccessibleSharedContent: jest.fn(),
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
const contentService = require('../content/content.service')
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

  test('deactivateCurrentPendingDelivery marks the earliest pending delivery inactive', async () => {
    const delivery = {
      id: 15,
      userId: 7,
      scheduledFor: new Date('2026-03-21T09:00:00.000Z'),
      status: 'PENDING',
    }
    const inactiveDelivery = {
      ...delivery,
      status: 'INACTIVE',
    }
    deliveryRepository.getCurrentPendingDeliveryForUser.mockResolvedValue(delivery)
    deliveryRepository.markDeliveryInactive.mockResolvedValue(inactiveDelivery)

    const result = await deliveryService.deactivateCurrentPendingDelivery(7)

    expect(deliveryRepository.getCurrentPendingDeliveryForUser).toHaveBeenCalledWith(7)
    expect(deliveryRepository.markDeliveryInactive).toHaveBeenCalledWith(15)
    expect(result).toEqual(inactiveDelivery)
  })

  test('deactivateCurrentPendingDelivery throws when the user has no pending delivery', async () => {
    deliveryRepository.getCurrentPendingDeliveryForUser.mockResolvedValue(null)

    await expect(deliveryService.deactivateCurrentPendingDelivery(7)).rejects.toMatchObject({
      message: 'no pending delivery found',
      status: 404,
    })

    expect(deliveryRepository.markDeliveryInactive).not.toHaveBeenCalled()
  })

  test('processPendingDeliveries uses unseen owned content first and marks delivery sent', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))
    deliveryRepository.listPendingDeliveriesDue.mockResolvedValue([
      {
        id: 11,
        userId: 7,
        user: { id: 7, username: 'april', email: 'april@example.com' },
      },
    ])
    deliveryRepository.listSentDeliveriesForUser.mockResolvedValue([
      { id: 1, contentId: 100, sharedContentId: null, scheduledFor: new Date('2026-03-10T09:00:00.000Z') },
    ])
    contentService.listContentSummariesByUser.mockResolvedValue([
      {
        id: 100,
        title: 'First memory',
        description: 'Already sent',
        public_id: 'memories/first',
        resource_type: 'image',
        uploaded_at: new Date('2026-03-01T09:00:00.000Z'),
      },
      {
        id: 101,
        title: 'Second memory',
        description: 'Still unseen',
        public_id: 'memories/second',
        resource_type: 'image',
        uploaded_at: new Date('2026-03-02T09:00:00.000Z'),
      },
    ])
    contentService.listAccessibleSharedContent.mockResolvedValue([])
    getChatCompletion.mockResolvedValue('A warm memory note.')
    getSignedImageUrl.mockReturnValue('https://cloudinary.example/primary.jpg')

    const result = await deliveryService.processPendingDeliveries(new Date('2026-03-20T12:00:00.000Z'))

    expect(contentService.listContentSummariesByUser).toHaveBeenCalledWith(7)
    expect(contentService.listAccessibleSharedContent).toHaveBeenCalledWith(7)
    expect(getChatCompletion).toHaveBeenCalledWith(
      expect.stringContaining('Primary memory title: Second memory'),
    )
    expect(deliveryRepository.markDeliverySent).toHaveBeenCalledWith(11, 101, null)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['april@example.com'],
        html: expect.stringContaining('Second memory'),
      }),
    )
    expect(result).toEqual([
      expect.objectContaining({
        deliveryId: 11,
        userId: 7,
        status: 'SENT',
        contentId: 101,
        sharedContentId: null,
      }),
    ])
  })

  test('processPendingDeliveries includes shared content when available', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-2' }, error: null })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))
    deliveryRepository.listPendingDeliveriesDue.mockResolvedValue([
      {
        id: 12,
        userId: 8,
        user: { id: 8, username: 'april', email: 'april@example.com' },
      },
    ])
    deliveryRepository.listSentDeliveriesForUser.mockResolvedValue([])
    contentService.listContentSummariesByUser.mockResolvedValue([
      {
        id: 201,
        title: 'Beach day',
        description: 'Sunset walk',
        public_id: 'memories/beach-day',
        resource_type: 'image',
        uploaded_at: new Date('2026-03-02T09:00:00.000Z'),
      },
    ])
    contentService.listAccessibleSharedContent.mockResolvedValue([
      {
        id: 301,
        title: 'Shared picnic',
        description: 'A friend shared this',
        public_id: 'memories/shared-picnic',
        resource_type: 'image',
        uploaded_at: new Date('2026-03-03T09:00:00.000Z'),
        user: {
          id: 99,
          username: 'friend',
          name: 'Friend',
        },
      },
    ])
    getChatCompletion.mockResolvedValue('A note with shared context.')
    getSignedImageUrl
      .mockReturnValueOnce('https://cloudinary.example/primary.jpg')
      .mockReturnValueOnce('https://cloudinary.example/shared.jpg')

    const result = await deliveryService.processPendingDeliveries()

    expect(getChatCompletion).toHaveBeenCalledWith(
      expect.stringContaining('Shared memory title: Shared picnic'),
    )
    expect(deliveryRepository.markDeliverySent).toHaveBeenCalledWith(12, 201, 301)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('From your shared network: Shared picnic'),
      }),
    )
    expect(result[0]).toEqual(
      expect.objectContaining({
        status: 'SENT',
        contentId: 201,
        sharedContentId: 301,
      }),
    )
  })

  test('processPendingDeliveries marks delivery failed when sending throws', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'send failed' } })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))
    deliveryRepository.listPendingDeliveriesDue.mockResolvedValue([
      {
        id: 13,
        userId: 9,
        user: { id: 9, username: 'april', email: 'april@example.com' },
      },
    ])
    deliveryRepository.listSentDeliveriesForUser.mockResolvedValue([])
    contentService.listContentSummariesByUser.mockResolvedValue([
      {
        id: 401,
        title: 'Morning coffee',
        description: 'Simple moment',
        public_id: 'memories/morning-coffee',
        resource_type: 'image',
        uploaded_at: new Date('2026-03-04T09:00:00.000Z'),
      },
    ])
    contentService.listAccessibleSharedContent.mockResolvedValue([])
    getChatCompletion.mockResolvedValue('A short note.')
    getSignedImageUrl.mockReturnValue('https://cloudinary.example/primary.jpg')

    const result = await deliveryService.processPendingDeliveries()

    expect(deliveryRepository.markDeliveryFailed).toHaveBeenCalledWith(13)
    expect(result).toEqual([
      expect.objectContaining({
        deliveryId: 13,
        userId: 9,
        status: 'FAILED',
        error: 'send failed',
      }),
    ])
  })

  test('generateAndSendMessageEmail embeds the signed image url in the email html body', async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-3' }, error: null })
    Resend.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }))
    getChatCompletion.mockResolvedValue('A good memory.')
    getSignedImageUrl.mockReturnValue('https://cloudinary.example/image.jpg')

    await deliveryService.generateAndSendMessageEmail(
      'april@example.com',
      'Beach day',
      'With friends',
      'memories/beach-day',
      'image',
    )

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@resend.dev',
        to: ['april@example.com'],
        html: expect.stringContaining('<img src="https://cloudinary.example/image.jpg"'),
      }),
    )
  })
})
