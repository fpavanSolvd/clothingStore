const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');

jest.mock('../../repositories/userRepository');

describe('userController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should register user successfully', async () => {
		const req = {
			body: {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'password123',
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockNewUser = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'password123',
			role: 'customer',
		};

		userRepository.getByEmail.mockResolvedValue(null); // Simulate user not found (email doesn't exist)
		userRepository.insertUser.mockResolvedValue(mockNewUser);

		await userController.registerUser(req, res);

		expect(userRepository.getByEmail).toHaveBeenCalledWith('john.doe@example.com');
		expect(userRepository.insertUser).toHaveBeenCalledWith(
			req.body.name,
			req.body.email,
			req.body.password,
			req.body.role
		);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(mockNewUser);
	});

	test('should handle required fields missing error', async () => {
		const req = {
			body: {
				// Missing required fields
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await userController.registerUser(req, res);

		expect(userRepository.getByEmail).not.toHaveBeenCalled();
		expect(userRepository.insertUser).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'All required fields must be provided' });
	});

	test('should handle invalid role error', async () => {
		const req = {
			body: {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'password123',
				role: 'invalidRole', // Invalid role
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await userController.registerUser(req, res);

		expect(userRepository.getByEmail).not.toHaveBeenCalled();
		expect(userRepository.insertUser).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'role must be admin or customer' });
	});

	test('should handle existing email error', async () => {
		const req = {
			body: {
				name: 'John Doe',
				email: 'existing.email@example.com', // Existing email
				password: 'password123',
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockExistingUser = {
			name: 'John Doe',
			email: 'existing.email@example.com',
			password: 'password123',
			role: 'customer',
		};

		userRepository.getByEmail.mockResolvedValue(mockExistingUser); // Simulate user already existing with the provided email

		await userController.registerUser(req, res);

		expect(userRepository.getByEmail).toHaveBeenCalledWith('existing.email@example.com');
		expect(userRepository.insertUser).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Email existing.email@example.com already exists' });
	});

	test('should handle general error', async () => {
		const req = {
			body: {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'password123',
				role: 'customer',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getByEmail.mockRejectedValue(new Error('Some database error')); // Simulate a database error

		await userController.registerUser(req, res);

		expect(userRepository.getByEmail).toHaveBeenCalledWith('john.doe@example.com');
		expect(userRepository.insertUser).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error creating user' });
	});
});
