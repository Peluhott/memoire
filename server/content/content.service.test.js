jest.mock('./content.repository', () => ({
  createContent: jest.fn(),
  deleteContentByIdForUser: jest.fn(),
  getContentByIdForUser: jest.fn(),
  getContentByUser: jest.fn(),
  getContentCountByUser: jest.fn(),
  toggleSharedWithNetwork: jest.fn(),
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
})
