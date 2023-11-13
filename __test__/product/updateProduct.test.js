const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('updateProduct', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update product successfully', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 2 },
      body: { price: 7 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockProduct = { productId: 2, price: 2 };
    const mockUpdatedProduct = { productId: 2, price: 7 };

    productRepository.getById.mockResolvedValue([mockProduct]);
    productRepository.update.mockResolvedValue(mockUpdatedProduct); 

    await productController.updateProduct(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(2);
    expect(productRepository.update).toHaveBeenCalledWith(2, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product updated successfully' });
  });

  test('should handle product not found error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
      body: { price: 6 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockResolvedValue([]);

    await productController.updateProduct(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productRepository.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product with id 1 not found' });
  });

  test('should handle access denied error', async () => {
    const req = {
      decoded: { role: 'customer' }, // Non-admin role
      params: { productId: 2 },
      body: { price: 6 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await productController.updateProduct(req, res);

    expect(productRepository.getById).not.toHaveBeenCalled();
    expect(productRepository.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle general error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
      body: { price: 6 },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    productRepository.getById.mockRejectedValue(new Error('Some database error'));
  
    try {
      await productController.updateProduct(req, res);
    } catch (error) {
      // Handle the error if needed
    }
  
    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productRepository.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error updating product' });
  });
});
