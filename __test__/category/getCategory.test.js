const categoryController = require('../../controllers/categoryController');
const categoryRepository = require('../../repositories/categoryRepository');

jest.mock('../../repositories/categoryRepository');

describe('getCategory', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('should get category successfully', async () => {
		const req = {
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const mockCategory = { categoryId: 1, name: 'Clothing' };

		categoryRepository.getById.mockResolvedValue(mockCategory);

		await categoryController.getCategory(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockCategory);
	});

	test('should handle category not found error', async () => {
		const req = {
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		categoryRepository.getById.mockResolvedValue(null);

		await categoryController.getCategory(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'Category with id 1 not found' });
	});

	test('should handle error when fetching category', async () => {
		const req = {
			params: { categoryId: 1 },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const errorMessage = 'Error fetching category';

		categoryRepository.getById.mockRejectedValue(new Error(errorMessage));

		await categoryController.getCategory(req, res);

		expect(categoryRepository.getById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
	});
});
