const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');
const productOptionRepository = require('../../repositories/productOptionRepository');

jest.mock('../../repositories/productRepository');
jest.mock('../../repositories/productOptionRepository');

describe('createOption', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create options successfully', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
      body: [{
        red: {
            s: 2
        }
      }],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockOptions = {
        red: {
            s: 2
        }
      };
    const mockProduct = { productId: 1, category: ['Skirt'], price: 19.99, options: mockOptions };
    

    productRepository.getById.mockResolvedValue([mockProduct]);
    productOptionRepository.create.mockResolvedValue();
    productRepository.getById.mockResolvedValue([mockProduct]);

    await productController.createOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productOptionRepository.create).toHaveBeenCalledWith(1, req.body);
    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productController.formatProducts([mockProduct]));
  });

  test('should handle product not found error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 2 },
      body: [{
        red: {
            s: 2
        }
      }],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockResolvedValue([]);

    await productController.createOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(2);
    expect(productOptionRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product with id 2 not found' });
  });

  test('should handle access denied error', async () => {
    const req = {
      decoded: { role: 'customer' }, // Non-admin role
      params: { productId: 1 },
      body: [{
        red: {
            s: 2
        }
      }],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await productController.createOption(req, res);

    expect(productRepository.getById).not.toHaveBeenCalled();
    expect(productOptionRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You are not an admin.' });
  });

  test('should handle general error', async () => {
    const req = {
      decoded: { role: 'admin' },
      params: { productId: 1 },
      body: [{
        red: {
            s: 2
        }
      }],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getById.mockRejectedValue(new Error('Some database error'));

    await productController.createOption(req, res);

    expect(productRepository.getById).toHaveBeenCalledWith(1);
    expect(productOptionRepository.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error adding options to the product' });
  });
});
