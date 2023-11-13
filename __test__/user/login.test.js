const userController = require('../../controllers/userController');
const userRepository = require('../../repositories/userRepository');
const jwt = require('../../auth/jwt');
const config = require('../../config');

jest.mock('../../repositories/userRepository');
jest.mock('../../auth/jwt');

jwt.mockImplementation(() => {
	return {
		encode: jest.fn(() => {
			return 'mockedToken';
		})
	};
});

describe('userController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should login successfully and return a token', async () => {
		const req = {
			body: {
				iss: 'issuer',
				sub: 'subject',
				email: 'john.doe@example.com',
				password: 'password123',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockUser = {
			user_id: 1,
			role: 'customer',
		};

		userRepository.getByEmailAndPassword.mockResolvedValue(mockUser);

		await userController.login(req, res);


		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ token: 'mockedToken' });
	});

	test('should handle missing fields in request error', async () => {
		const req = {
			body: {
				// Missing required fields
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await userController.login(req, res);

		expect(userRepository.getByEmailAndPassword).not.toHaveBeenCalled();
		expect(jwt(config.secret).encode).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: 'Request must include email and password along with jwt payload requirements: sub and iss',
		});
	});

	test('should handle incorrect email or password error', async () => {
		const req = {
			body: {
				iss: 'issuer',
				sub: 'subject',
				email: 'john.doe@example.com',
				password: 'incorrectPassword',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getByEmailAndPassword.mockResolvedValue(null); // Simulate incorrect email or password

		await userController.login(req, res);

		expect(userRepository.getByEmailAndPassword).toHaveBeenCalledWith(
			req.body.email,
			req.body.password
		);
		expect(jwt(config.secret).encode).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: 'Incorrect email or password' });
	});

	test('should handle general error', async () => {
		const req = {
			body: {
				iss: 'issuer',
				sub: 'subject',
				email: 'john.doe@example.com',
				password: 'password123',
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		userRepository.getByEmailAndPassword.mockRejectedValue(new Error('Some database error')); // Simulate a database error

		await userController.login(req, res);

		expect(userRepository.getByEmailAndPassword).toHaveBeenCalledWith(
			req.body.email,
			req.body.password
		);
		expect(jwt(config.secret).encode).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error logging in' });
	});
});
