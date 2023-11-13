const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');

jest.mock('../../repositories/userRepository');

describe('userController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update user succesfully for admin', async () => {
    const req = {
      params: {
        userId: 1,
      },
      decoded: {
        role: 'admin',
        userId: 1, // Admin's user id
      },
      body: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'updatedpassword',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUpdatedUser = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'updatedpassword',
        role: 'admin'
    };

    userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      1,
      req.body.name,
      req.body.email,
      req.body.password
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('User updated succesfully');
  });

  test('should update own user succesfully for non-admin', async () => {
    const req = {
      params: {
        userId: 1,
      },
      decoded: {
        role: 'customer',
        userId: 1, // User's own user id
      },
      body: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'updatedpassword',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUpdatedUser = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'updatedpassword',
        role: 'customer'
    };

    userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      1,
      req.body.name,
      req.body.email,
      req.body.password
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('User updated succesfully');
  });

  test('should handle access denied error for non-admin updating different user', async () => {
    const req = {
      params: {
        userId: 1, // Different user id
      },
      decoded: {
        role: 'customer',
        userId: 2, // User's own user id
      },
      body: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'updatedpassword',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle no valid updates provided error', async () => {
    const req = {
      params: {
        userId: 1,
      },
      decoded: {
        role: 'admin',
        userId: 1, // Admin's user id
      },
      body: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No valid updates provided' });
  });

  test('should handle user not found error', async () => {
    const req = {
      params: {
        userId: 2,
      },
      decoded: {
        role: 'admin',
        userId: 1, // Admin's user id
      },
      body: {
        name: 'John Doe',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.updateUser.mockResolvedValue(null); // Simulate user not found

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      2,
      req.body.name,
      req.body.email,
      req.body.password
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User with id 2 not found' });
  });

  test('should handle general error', async () => {
    const req = {
      params: {
        userId: 1,
      },
      decoded: {
        role: 'admin',
        userId: 1, // Admin's user id
      },
      body: {
        name: 'John Doe',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.updateUser.mockRejectedValue(new Error('Some database error')); // Simulate a database error

    await userController.updateUser(req, res);

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      1,
      req.body.name,
      req.body.email,
      req.body.password
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error updating user' });
  });
});
