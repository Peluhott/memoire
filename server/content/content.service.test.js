jest.mock('./content.repository', () => ({
  createContent: jest.fn(),
  deleteContentByIdForUser: jest.fn(),
  getContentByIdForUser: jest.fn(),
  getContentByUser: jest.fn(),
  getContentCountByUser: jest.fn(),
  getSharedContentIdsByUserIds: jest.fn(),
  toggleSharedWithNetwork: jest.fn(),
}))

jest.mock('../connection/connection.repository', () => ({
  listAcceptedConnectionUserIds: jest.fn(),
}))

jest.mock('../delivery/delivery.service', () => ({
  __esModule: true,
  default: {
    scheduleRandomDelivery: jest.fn(),
  },
}))

jest.mock('../util/uploadImage', () => ({
  uploadProductImage: jest.fn(),
}))

jest.mock('../util/getSignedImage', () => ({
  getSignedImageUrl: jest.fn(),
}))

jest.mock('../util/deleteImage', () => ({
  deleteProductImage: jest.fn(),
}))

const repository = require('./content.repository')
const connectionRepository = require('../connection/connection.repository')
const deliveryService = require('../delivery/delivery.service').default
const { getSignedImageUrl } = require('../util/getSignedImage')
const { deleteProductImage } = require('../util/deleteImage')
const contentService = require('./content.service.ts')

describe('content.service', () => {
  test('createContent blocks uploads when the content limit is reached', async () => {
    repository.getContentCountByUser.mockResolvedValue(5)

    await expect(
      contentService.createContent(7, 'public-id', 'image', 'authenticated', 'Title', 'Body', false, 5),
    ).rejects.toThrow('content_limit_reached')

    expect(repository.createContent).not.toHaveBeenCalled()
  })

  test('createContentForUpload schedules a delivery once the user reaches five memories', async () => {
    repository.getContentCountByUser.mockResolvedValue(4)
    repository.createContent.mockResolvedValue({ id: 9, title: 'Title' })
    deliveryService.scheduleRandomDelivery.mockResolvedValue({ id: 12, status: 'PENDING' })

    const result = await contentService.createContentForUpload(
      7,
      'public-id',
      'image',
      'authenticated',
      'Title',
      'Body',
      false,
      10,
    )

    expect(repository.createContent).toHaveBeenCalledWith(
      7,
      'public-id',
      'image',
      'authenticated',
      'Title',
      'Body',
      false,
    )
    expect(deliveryService.scheduleRandomDelivery).toHaveBeenCalledWith(7)
    expect(result).toEqual({
      content: { id: 9, title: 'Title' },
      deliveryScheduled: true,
      delivery: { id: 12, status: 'PENDING' },
    })
  })

  test('createContentForUpload does not schedule a delivery before five memories', async () => {
    repository.getContentCountByUser.mockResolvedValue(3)
    repository.createContent.mockResolvedValue({ id: 8, title: 'Title' })

    const result = await contentService.createContentForUpload(
      7,
      'public-id',
      'image',
      'authenticated',
      'Title',
      'Body',
      false,
      10,
    )

    expect(deliveryService.scheduleRandomDelivery).not.toHaveBeenCalled()
    expect(result).toEqual({
      content: { id: 8, title: 'Title' },
      deliveryScheduled: false,
      delivery: null,
    })
  })

  test('getSignedUrlForContent returns a signed image url for owned content', async () => {
    repository.getContentByIdForUser.mockResolvedValue({
      id: 3,
      public_id: 'memories/photo-1',
      resource_type: 'image',
    })
    getSignedImageUrl.mockReturnValue('https://cloudinary.example/signed-image')

    const url = await contentService.getSignedUrlForContent(3, 7)

    expect(getSignedImageUrl).toHaveBeenCalledWith('memories/photo-1', 'image')
    expect(url).toBe('https://cloudinary.example/signed-image')
  })

  test('deleteContent removes the image from Cloudinary before deleting the record', async () => {
    repository.getContentByIdForUser.mockResolvedValue({
      id: 4,
      public_id: 'memories/photo-4',
      resource_type: 'image',
      title: 'Beach day',
    })
    repository.deleteContentByIdForUser.mockResolvedValue({ count: 1 })

    const deleted = await contentService.deleteContent(4, 9)

    expect(deleteProductImage).toHaveBeenCalledWith('memories/photo-4', 'image')
    expect(repository.deleteContentByIdForUser).toHaveBeenCalledWith(4, 9)
    expect(deleted).toEqual(
      expect.objectContaining({ id: 4, public_id: 'memories/photo-4', title: 'Beach day' }),
    )
  })

  test('getAccessibleSharedContentIds returns ids shared by accepted connections', async () => {
    connectionRepository.listAcceptedConnectionUserIds.mockResolvedValue([3, 8])
    repository.getSharedContentIdsByUserIds.mockResolvedValue([12, 19])

    const result = await contentService.getAccessibleSharedContentIds(7)

    expect(connectionRepository.listAcceptedConnectionUserIds).toHaveBeenCalledWith(7)
    expect(repository.getSharedContentIdsByUserIds).toHaveBeenCalledWith([3, 8])
    expect(result).toEqual([12, 19])
  })
})
