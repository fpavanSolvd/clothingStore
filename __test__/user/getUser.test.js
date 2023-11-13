const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');

jest.mock('../../repositories/userRepository');

describe('userController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should get user successfully for admin', async () => {
		const req = {
			params: {
				userId: 1,
			},
			decoded: {
				role: 'admin',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockUser = {
			id: 1,
			name: 'Sara Perez',
			email: 'sara.perez@example.com',
			role: 'customer'
		};

		userRepository.getById.mockResolvedValue(mockUser);

		await userController.getUser(req, res);

		expect(userRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockUser);
	});

	test('should get user successfully for own user id', async () => {
		const req = {
			params: {
				userId: 1,
			},
			decoded: {
				role: 'customer',
				userId: 1, // Own user id
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockUser = {
			id: 1,
			name: 'Sara Perez',
			email: 'sara.perez@example.com',
			role: 'customer'
		};

		userRepository.getById.mockResolvedValue(mockUser);

		await userController.getUser(req, res);

		expect(userRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockUser);
	});

	test('should handle access denied error for non-admin and different user id', async () => {
		const req = {
			params: {
				userId: 1,
			},
			decoded: {
				role: 'customer',
				userId: 2, // Different user id
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await userController.getUser(req, res);

		expect(userRepository.getById).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
	});

	test('should handle user not found error', async () => {
		const req = {
			params: {
				userId: 3,
			},
			decoded: {
				role: 'admin',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getById.mockResolvedValue(null); // Simulate user not found

		await userController.getUser(req, res);

		expect(userRepository.getById).toHaveBeenCalledWith(3);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'User with id 3 not found' });
	});

	test('should handle general error', async () => {
		const req = {
			params: {
				userId: 1,
			},
			decoded: {
				role: 'admin',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getById.mockRejectedValue(new Error('Some database error')); // Simulate a database error

		await userController.getUser(req, res);

		expect(userRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching user' });
	});
});
