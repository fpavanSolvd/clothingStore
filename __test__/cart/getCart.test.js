const cartController = require('../../controllers/cartController');
const cartRepository = require('../../repositories/cartRepository');

jest.mock('../../repositories/cartRepository');

describe('cartController', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should get cart details successfully', async () => {
		const req = {
			params: {
				cartId: 1,
			},
			decoded: {
				role: 'admin',
				userId: 1,
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockCartDetails = {
			cartId: 1,
			userId: 1,
			products: [
				{
					productId: 2,
					options: {
						blue: {
							s: 1
						}
					}
				}
			]
		};

		cartRepository.getById.mockResolvedValue(mockCartDetails);
		cartRepository.getWithItems.mockResolvedValue(mockCartDetails);

		await cartController.getCart(req, res);

		expect(cartRepository.getById).toHaveBeenCalledWith(1, 'admin', 1);
		expect(cartRepository.getWithItems).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			cartId: mockCartDetails.cartId,
			userId: mockCartDetails.userId,
			products: mockCartDetails.products,
		});
	});

	test('should handle cart not found error', async () => {
		const req = {
			params: {
				cartId: 1,
			},
			decoded: {
				role: 'admin',
				userId: 1,
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		cartRepository.getById.mockResolvedValue(null); // Simulate cart not found

		await cartController.getCart(req, res);

		expect(cartRepository.getById).toHaveBeenCalledWith(1, 'admin', 1);
		expect(cartRepository.getWithItems).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'Cart with id 1 not found' });
	});

	test('should handle general error', async () => {
		const req = {
			params: {
				cartId: 1,
			},
			decoded: {
				role: 'admin',
				userId: 1,
			},
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		cartRepository.getById.mockRejectedValue(new Error('Some database error')); // Simulate a database error

		await cartController.getCart(req, res);

		expect(cartRepository.getById).toHaveBeenCalledWith(1, 'admin', 1);
		expect(cartRepository.getWithItems).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching cart details' });
	});
});
