const productController = require('../../controllers/productController');
const productRepository = require('../../repositories/productRepository');

jest.mock('../../repositories/productRepository');

describe('getProducts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should get products successfully', async () => {
    const req = {
      query: {  },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockProducts = [
      { productId: 1, price: 2 },
      { productId: 2, price: 5 },
    ];

    productRepository.getAll.mockResolvedValue(mockProducts);

    await productController.getProducts(req, res);

    expect(productRepository.getAll).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productController.formatProducts(mockProducts));
  });

  test('should handle error when listing products', async () => {
    const req = {
      query: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    productRepository.getAll.mockRejectedValue(new Error('Some database error'));

    await productController.getProducts(req, res);

    expect(productRepository.getAll).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error listing products' });
  });
});

