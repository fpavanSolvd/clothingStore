const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');

jest.mock('../../repositories/userRepository');

describe('userController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should get users successfully for admin', async () => {
		const req = {
			decoded: {
				role: 'admin',
			},
			query: {
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockUsers = [
			{
				id: 1,
				name: 'Sam Thompson',
				email: 'sam.thompson@example.com',
				role: 'customer'
			},
			{
				id: 2,
				name: 'Sara Perez',
				email: 'sara.perez@example.com',
				role: 'customer'
			}
		];

		userRepository.getAll.mockResolvedValue(mockUsers);

		await userController.getUsers(req, res);

		expect(userRepository.getAll).toHaveBeenCalledWith('customer');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockUsers);
	});

	test('should handle access denied error for non-admin', async () => {
		const req = {
			decoded: {
				role: 'customer', // Non-admin role
			},
			query: {
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await userController.getUsers(req, res);

		expect(userRepository.getAll).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
	});

	test('should handle general error', async () => {
		const req = {
			decoded: {
				role: 'admin',
			},
			query: {
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getAll.mockRejectedValue(new Error('Some database error')); // Simulate a database error

		await userController.getUsers(req, res);

		expect(userRepository.getAll).toHaveBeenCalledWith('customer');
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching users' });
	});
});
