const cartController = require('../../controllers/cartController');
const userRepository = require('../../repositories/userRepository');
const cartRepository = require('../../repositories/cartRepository');

jest.mock('../../repositories/userRepository');
jest.mock('../../repositories/cartRepository');

describe('createCart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a cart for the user', async () => {
    const req = {
      params: {
        userId: '123',
      },
      decoded: {
        role: 'admin',
        userId: '123',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = { 
      user_id: '123',
      name: 'john doe',
      email: 'john.doe@example.com',
      role: 'admin',
     };
    const mockCartId = 1;

    userRepository.getById.mockResolvedValue(mockUser);
    cartRepository.create.mockResolvedValue(mockCartId);

    await cartController.createCart(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith('123');
    expect(cartRepository.create).toHaveBeenCalledWith('123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      cartId: mockCartId,
      userId: '123',
      products: [],
    });
  });

  test('should handle access denied error', async () => {
    const req = {
      params: {
        userId: '456',
      },
      decoded: {
        role: 'user', // Non-admin role
        userId: '789', // Different user ID
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await cartController.createCart(req, res);

    expect(userRepository.getById).not.toHaveBeenCalled();
    expect(cartRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle user not found error', async () => {
    const req = {
      params: {
        userId: '123',
      },
      decoded: {
        role: 'admin',
        userId: '123',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.getById.mockResolvedValue(null); // Simulate user not found

    await cartController.createCart(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith('123');
    expect(cartRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User with id 123 not found' });
  });

  test('should handle general error', async () => {
    const req = {
      params: {
        userId: '123',
      },
      decoded: {
        role: 'admin',
        userId: '123',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    userRepository.getById.mockRejectedValue(new Error('Some database error')); // Simulate a database error

    await cartController.createCart(req, res);

    expect(userRepository.getById).toHaveBeenCalledWith('123');
    expect(cartRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error creating a cart for the user' });
  });
});
