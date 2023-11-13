const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('createProduct', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should create product successfully', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { category: ['Skirt'], price: 19.99 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockProduct = { productId: 1, category: ['Skirt'], price: 19.99 };

		productRepository.create.mockResolvedValue(mockProduct);

		await productController.createProduct(req, res);

		expect(productRepository.create).toHaveBeenCalledWith(['Skirt'], 19.99);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(productController.formatProducts([{ productId: 1, category: ['Skirt'], price: 19.99 }]));
	});

	test('should handle access denied error', async () => {
		const req = {
			decoded: { role: 'customer' }, // Non-admin role
			body: { category: ['Shoes'], price: 29.99 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await productController.createProduct(req, res);

		expect(productRepository.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
	});

	test('should handle missing or invalid properties error', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { category: [], price: null }, // Invalid properties
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await productController.createProduct(req, res);

		expect(productRepository.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Category and price are required properties' });
	});

	test('should handle general error', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { category: ['Skirt'], price: 99.99 },
		};

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		productRepository.create.mockRejectedValue(new Error('Some database error'));

		await productController.createProduct(req, res);

		expect(productRepository.create).toHaveBeenCalledWith(['Skirt'], 99.99);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error creating product' });
	});
});
