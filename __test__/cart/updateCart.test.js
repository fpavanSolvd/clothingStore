const cartController = require('../../controllers/cartController');
const cartRepository = require('../../repositories/cartRepository');

jest.mock('../../repositories/cartRepository');

describe('cartController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update cart with a product', async () => {
    const req = {
      params: {
        cartId: 1,
      },
      body: {
        productId: 1,
        options: {
                red: {
                    l: 1
                }
            }
      },
      decoded: {
        role: 'admin',
        userId: 1,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockCart = { 
        cartId: 1,
        userId: 1,
        products: []
    };
    const mockUpdatedCart = {
        cartId: 1,
        userId: 1,
        products: [
            {
                productId: 1,
                options: {
                    red: {
                        l: 1
                    }
                }
            }
        ]
    };

    cartRepository.getById.mockResolvedValue(mockCart);
    cartRepository.addProduct.mockResolvedValue();
    cartRepository.getWithItems.mockResolvedValue(mockUpdatedCart);

    await cartController.updateCart(req, res);

    expect(cartRepository.getById).toHaveBeenCalledWith(1, 'admin', 1);
    expect(cartRepository.addProduct).toHaveBeenCalledWith(1, 1, { red: { l: 1 } });
    expect(cartRepository.getWithItems).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUpdatedCart);
  });

  test('should handle cart not found error', async () => {
    const req = {
      params: {
        cartId: 2,
      },
      body: {
        productId: 1,
        options: {
            red: {
                l: 1
            }
        },
      },
      decoded: {
        role: 'admin',
        userId: 1,
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    cartRepository.getById.mockResolvedValue(null); // Simulate cart not found
  
    await cartController.updateCart(req, res);
  
    expect(cartRepository.getById).toHaveBeenCalledWith(2, 'admin', 1);
    expect(cartRepository.addProduct).not.toHaveBeenCalled();
    expect(cartRepository.getWithItems).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cart with id 2 not found' });
  });
  

  test('should handle general error', async () => {
    const req = {
      params: {
        cartId: 1,
      },
      body: {
        productId: 1,
        options: {
            red: {
                l: 1
            }
        },
      },
      decoded: {
        role: 'admin',
        userId: 1,
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    cartRepository.getById.mockRejectedValue(new Error('Some database error')); // Simulate a database error
  
    await cartController.updateCart(req, res);
  
    expect(cartRepository.getById).toHaveBeenCalledWith(1, 'admin', 1);
    expect(cartRepository.addProduct).not.toHaveBeenCalled();
    expect(cartRepository.getWithItems).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error adding products to cart' });
  });
  
});
