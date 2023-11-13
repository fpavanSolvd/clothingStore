const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('getProduct', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should get product successfully', async () => {
		const req = {
			params: { productId: 1 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockProduct = { productId: 1, price: 4 };

		productRepository.getById.mockResolvedValue([mockProduct]);

		await productController.getProduct(req, res);

		expect(productRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(productController.formatProducts([mockProduct]));
	});

	test('should handle product not found error', async () => {
		const req = {
			params: { productId: 2 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		productRepository.getById.mockResolvedValue([]);

		await productController.getProduct(req, res);

		expect(productRepository.getById).toHaveBeenCalledWith(2);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'Product with id 2 not found' });
	});

	test('should handle general error', async () => {
		const req = {
			params: { productId: 2 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		productRepository.getById.mockRejectedValue(new Error('Some database error'));

		await productController.getProduct(req, res);

		expect(productRepository.getById).toHaveBeenCalledWith(2);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching product' });
	});
});
