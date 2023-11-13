const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('deleteProduct', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should delete product successfully', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockProduct = { productId: 1, category: ['Skirt'], price: 19.99 };

    productRepository.getById.mockResolvedValue([mockProduct]);
    productRepository.delete.mockResolvedValue(); 

    await productController.deleteProduct(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productRepository.delete).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product and associated entries deleted successfully' });
  });

  test('should handle product not found error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 2 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockResolvedValue([]);

    await productController.deleteProduct(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(2);
    expect(productRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product with id 2 not found' });
  });

  test('should handle access denied error', async () => {
    const req = {
      decoded: { role: 'customer' }, // Non-admin role
      params: { productId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await productController.deleteProduct(req, res);

    expect(productRepository.getById).not.toHaveBeenCalled();
    expect(productRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle general error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockRejectedValue(new Error('Some database error'));

    await productController.deleteProduct(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productRepository.delete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error deleting product' });
  });
});
