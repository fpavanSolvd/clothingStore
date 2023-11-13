const { formatProducts } = require('../../controllers/productController');

describe('formatProducts', () => {
  test('should format single product correctly', () => {
    const product = {
      product_id: 1,
      category: 'Skirt',
      price: 19.99,
      color: 'Red',
      size: 'Medium',
      stock: 10,
    };

    const formattedProducts = formatProducts(product);

    expect(formattedProducts).toEqual([
      {
        product_id: 1,
        category: ['Skirt'],
        price: 19.99,
        options: {
          Red: {
            Medium: 10,
          },
        },
      },
    ]);
  });

  test('should format multiple products correctly', () => {
    const products = [
      {
        product_id: 1,
        category: 'Skirt',
        price: 19.99,
        color: 'Red',
        size: 'Medium',
        stock: 10,
      },
      {
        product_id: 2,
        category: 'Footwear',
        price: 39.99,
        color: 'Blue',
        size: 'Large',
        stock: 5,
      },
    ];

    const formattedProducts = formatProducts(products);

    expect(formattedProducts).toEqual([
      {
        product_id: 1,
        category: ['Skirt'],
        price: 19.99,
        options: {
          Red: {
            Medium: 10,
          },
        },
      },
      {
        product_id: 2,
        category: ['Footwear'],
        price: 39.99,
        options: {
          Blue: {
            Large: 5,
          },
        },
      },
    ]);
  });
});

