const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');

jest.mock('../../repositories/userRepository');

describe('deleteUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should delete user successfully as an admin', async () => {
    const req = {
      params: { userId: 2 },
      decoded: { role: 'admin', userId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = { user_id: 2 };
    userRepository.getById.mockResolvedValue(mockUser);

    await userController.deleteUser(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith(2);
    expect(userRepository.deleteUser).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
  });

  test('should delete own user successfully', async () => {
    const req = {
      params: { userId: 1 },
      decoded: { role: 'customer', userId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = { user_id: 1 };
    userRepository.getById.mockResolvedValue(mockUser);

    await userController.deleteUser(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith(1);
    expect(userRepository.deleteUser).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
  });

  test('should handle access denied error', async () => {
    const req = {
      params: { userId: 1 },
      decoded: { role: 'customer', userId: 2 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userController.deleteUser(req, res);

    expect(userRepository.getById).not.toHaveBeenCalled();
    expect(userRepository.deleteUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle user not found error', async () => {
    const req = {
      params: { userId: 2 },
      decoded: { role: 'admin', userId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.getById.mockResolvedValue(null);

    await userController.deleteUser(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith(2);
    expect(userRepository.deleteUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User with id 2 not found' });
  });

  test('should handle general error', async () => {
    const req = {
      params: { userId: 1 },
      decoded: { role: 'admin', userId: 2 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.getById.mockRejectedValue(new Error('Some database error'));

    await userController.deleteUser(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith(1);
    expect(userRepository.deleteUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error deleting user' });
  });
});
