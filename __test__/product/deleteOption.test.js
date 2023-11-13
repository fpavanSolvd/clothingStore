const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');
const productOptionRepository = require('../../repositories/productOptionRepository');

jest.mock('../../repositories/productRepository');
jest.mock('../../repositories/productOptionRepository');

describe('deleteOption', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should delete option successfully', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1, color: 'Red' },
      query: { size: 'Medium' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockProduct = { productId: 1, category: ['Skirt'], price: 19.99, options: {Red: { Medium: 1 } } };

    productRepository.getById.mockResolvedValue([mockProduct]);
    productOptionRepository.delete.mockResolvedValue();

    await productController.deleteOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productOptionRepository.delete).toHaveBeenCalledWith(1, 'Red', 'Medium');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Option deleted from the product successfully' });
  });

  test('should handle product not found error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 2, color: 'Red' },
      query: { size: 'Medium' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockResolvedValue([]);

    await productController.deleteOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(2);
    expect(productOptionRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product with id 2 not found' });
  });

  test('should handle access denied error', async () => {
    const req = {
      decoded: { role: 'customer' }, // Non-admin role
      params: { productId: 1, color: 'Red' },
      query: { size: 'Medium' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await productController.deleteOption(req, res);

    expect(productRepository.getById).not.toHaveBeenCalled();
    expect(productOptionRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle general error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1, color: 'Red' },
      query: { size: 'Medium' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockRejectedValue(new Error('Some database error'));

    await productController.deleteOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productOptionRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error deleting option from the product' });
  });
});
