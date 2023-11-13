const categoryController = require('../../controllers/categoryController');
const categoryRepository = require('../../repositories/categoryRepository');

jest.mock('../../repositories/categoryRepository');

describe('getCategories', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should get categories successfully', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockCategories = ['Clothing', 'Footwear', 'Accessories'];

    categoryRepository.getAll.mockResolvedValue(mockCategories);

    await categoryController.getCategories(req, res);

    expect(categoryRepository.getAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCategories);
  });

  test('should handle error when fetching categories', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const errorMessage = 'Error fetching categories';

    categoryRepository.getAll.mockRejectedValue(new Error(errorMessage));

    await categoryController.getCategories(req, res);

    expect(categoryRepository.getAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});
