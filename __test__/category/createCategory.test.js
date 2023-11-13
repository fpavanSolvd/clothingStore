const categoryController = require('../../controllers/categoryController');
const categoryRepository = require('../../repositories/categoryRepository');

jest.mock('../../repositories/categoryRepository');

describe('createCategory', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should create category successfully', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { description: 'Clothing' },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockCategory = { categoryId: 1, description: 'Clothing' };

		categoryRepository.getByDescription.mockResolvedValue(null); // Simulate category not existing
		categoryRepository.create.mockResolvedValue(mockCategory);

		await categoryController.create(req, res);

		expect(categoryRepository.getByDescription).toHaveBeenCalledWith('Clothing');
		expect(categoryRepository.create).toHaveBeenCalledWith('Clothing');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockCategory);
	});

	test('should handle access denied error', async () => {
		const req = {
			decoded: { role: 'customer' }, // Non-admin role
			body: { description: 'Clothing' },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await categoryController.create(req, res);

		expect(categoryRepository.getByDescription).not.toHaveBeenCalled();
		expect(categoryRepository.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
	});

	test('should handle missing description error', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: {}, // No description provided
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await categoryController.create(req, res);

		expect(categoryRepository.getByDescription).not.toHaveBeenCalled();
		expect(categoryRepository.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Category description not specified' });
	});

	test('should handle existing category error', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { description: 'Clothing' },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const existingCategory = { categoryId: 1, description: 'Clothing' };

		categoryRepository.getByDescription.mockResolvedValue(existingCategory);

		await categoryController.create(req, res);

		expect(categoryRepository.getByDescription).toHaveBeenCalledWith('Clothing');
		expect(categoryRepository.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Category Clothing already exists' });
	});

	test('should handle error when creating category', async () => {
		const req = {
			decoded: { role: 'admin' },
			body: { description: 'Clothing' },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const errorMessage = 'Error creating category';

		categoryRepository.getByDescription.mockResolvedValue(null);
		categoryRepository.create.mockRejectedValue(new Error(errorMessage));

		await categoryController.create(req, res);

		expect(categoryRepository.getByDescription).toHaveBeenCalledWith('Clothing');
		expect(categoryRepository.create).toHaveBeenCalledWith('Clothing');
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
	});
});
