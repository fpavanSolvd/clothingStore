const categoryController = require('../../controllers/categoryController');
const categoryRepository = require('../../repositories/categoryRepository');

jest.mock('../../repositories/categoryRepository');

describe('deleteCategory', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should delete category successfully', async () => {
		const req = {
			decoded: { role: 'admin' },
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};

		const mockCategory = { categoryId: 1, description: 'Clothing' };

		categoryRepository.getById.mockResolvedValue(mockCategory);

		await categoryController.delete(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(categoryRepository.delete).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(204);
		expect(res.send).toHaveBeenCalled();
	});

	test('should handle access denied error', async () => {
		const req = {
			decoded: { role: 'customer' }, // Non-admin role
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};

		await categoryController.delete(req, res);

		expect(categoryRepository.getById).not.toHaveBeenCalled();
		expect(categoryRepository.delete).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
	});

	test('should handle category not found error', async () => {
		const req = {
			decoded: { role: 'admin' },
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};

		categoryRepository.getById.mockResolvedValue(null);

		await categoryController.delete(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(categoryRepository.delete).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'Category with id 1 not found' });
	});

	test('should handle error when deleting category', async () => {
		const req = {
			decoded: { role: 'admin' },
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};

		const errorMessage = 'Error deleting category';

		categoryRepository.getById.mockResolvedValue({ categoryId: 1, description: 'Clothing' });
		categoryRepository.delete.mockRejectedValue(new Error(errorMessage));

		await categoryController.delete(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(categoryRepository.delete).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
	});
});
