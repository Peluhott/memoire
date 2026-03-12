jest.mock('../prisma/prisma', () => ({
  delivery: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}))

jest.mock('./delivery.repository', () => ({
  createDelivery: jest.fn(),
  getActiveDeliveryForReceiver: jest.fn(),
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

const prisma = require('../prisma/prisma')
const { Resend } = require('resend')
const { getChatCompletion } = require('../util/chatcompletion')
const { getSignedImageUrl } = require('../util/getSignedImage')
const deliveryService = require('./delivery.service.ts')

describe('delivery.service', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'resend-test-key'
  })

  test('openDelivery rejects users who are not the receiver', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 4,
      receiverId: 10,
      status: 'DELIVERED',
      dateSeen: null,
    })

    await expect(deliveryService.openDelivery(4, 99)).rejects.toMatchObject({
      message: 'only the receiver may open this delivery',
      status: 403,
    })
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
