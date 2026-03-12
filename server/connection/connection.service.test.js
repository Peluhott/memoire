jest.mock('./connection.repository', () => ({
  createConnection: jest.fn(),
}))

const repository = require('./connection.repository')
const connectionService = require('./connection.service.ts')

describe('connection.service', () => {
  test('createConnection rejects non-integer ids', async () => {
    await expect(connectionService.createConnection(1.5, 2)).rejects.toThrow(
      'user ids must be integers',
    )
  })

  test('createConnection forwards valid ids to the repository', async () => {
    repository.createConnection.mockResolvedValue({ id: 1, userAId: 1, userBId: 2 })

    const result = await connectionService.createConnection(1, 2)

    expect(repository.createConnection).toHaveBeenCalledWith(1, 2)
    expect(result).toEqual({ id: 1, userAId: 1, userBId: 2 })
  })
})
