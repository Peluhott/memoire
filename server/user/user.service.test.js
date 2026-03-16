process.env.JWT_SECRET = 'test-secret'

jest.mock('./user.repository', () => ({
  deleteUserAccount: jest.fn(),
  getUserById: jest.fn(),
  getUserByUsername: jest.fn(),
  incrementUserTokenVersion: jest.fn(),
  insertUser: jest.fn(),
  listUserContentAssets: jest.fn(),
  updateUserProfile: jest.fn(),
  updateUserPassword: jest.fn(),
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

jest.mock('../util/uploadImage', () => ({
  uploadProfileImage: jest.fn(),
}))

jest.mock('../util/deleteImage', () => ({
  deleteProductImage: jest.fn(),
}))

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const userRepository = require('./user.repository')
const { uploadProfileImage } = require('../util/uploadImage')
const { deleteProductImage } = require('../util/deleteImage')
const userService = require('./user.service.ts')

describe('user.service', () => {
  test('createUserService hashes the password before inserting the user', async () => {
    bcrypt.hash.mockResolvedValue('hashed-password')
    userRepository.insertUser.mockResolvedValue({ id: 1 })

    await userService.createUserService('april@example.com', 'april', 'plain-password')

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10)
    expect(userRepository.insertUser).toHaveBeenCalledWith(
      'april',
      'hashed-password',
      'april@example.com',
    )
  })

  test('loginUserService signs a token for a valid user', async () => {
    userRepository.getUserByUsername.mockResolvedValue({
      id: 12,
      username: 'april',
      password: 'stored-hash',
      tokenVersion: 3,
    })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('signed-token')

    const token = await userService.loginUserService('april', 'plain-password')

    expect(bcrypt.compare).toHaveBeenCalledWith('plain-password', 'stored-hash')
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 12, username: 'april', tokenVersion: 3 },
      'test-secret',
      { expiresIn: '1d' },
    )
    expect(token).toBe('signed-token')
  })

  test('loginUserService rejects an invalid password', async () => {
    userRepository.getUserByUsername.mockResolvedValue({
      id: 12,
      username: 'april',
      password: 'stored-hash',
      tokenVersion: 0,
    })
    bcrypt.compare.mockResolvedValue(false)

    await expect(userService.loginUserService('april', 'wrong-password')).rejects.toThrow(
      'wrong password',
    )
  })

  test('logoutUserService increments the user token version', async () => {
    userRepository.incrementUserTokenVersion.mockResolvedValue({ id: 5, tokenVersion: 2 })

    await userService.logoutUserService(5)

    expect(userRepository.incrementUserTokenVersion).toHaveBeenCalledWith(5)
  })

  test('deleteCurrentUserService deletes uploaded memory assets before removing the account', async () => {
    userRepository.getUserById.mockResolvedValue({ id: 5 })
    userRepository.listUserContentAssets.mockResolvedValue([
      { public_id: 'memories/one', resource_type: 'image' },
      { public_id: 'memories/two', resource_type: 'image' },
    ])
    userRepository.deleteUserAccount.mockResolvedValue({ id: 5 })

    await userService.deleteCurrentUserService(5)

    expect(deleteProductImage).toHaveBeenNthCalledWith(1, 'memories/one', 'image')
    expect(deleteProductImage).toHaveBeenNthCalledWith(2, 'memories/two', 'image')
    expect(userRepository.deleteUserAccount).toHaveBeenCalledWith(5)
  })

  test('uploadProfilePictureService uploads the file and stores the returned URL', async () => {
    const file = { path: '/tmp/avatar.png' }
    uploadProfileImage.mockResolvedValue({
      public_id: 'profile-pictures/user-1',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    })
    userRepository.updateUserProfile.mockResolvedValue({ id: 5, profilePictureUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.png' })

    const result = await userService.uploadProfilePictureService(5, file)

    expect(uploadProfileImage).toHaveBeenCalledWith(file)
    expect(userRepository.updateUserProfile).toHaveBeenCalledWith(5, {
      profilePictureUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    })
    expect(result).toEqual({
      id: 5,
      profilePictureUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    })
  })
})
