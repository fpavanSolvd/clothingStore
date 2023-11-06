const express = require('express');
const pool = require('../database/db');
const authMiddleware = require('../auth/authMiddleware');

const cartRouter = express.Router();

cartRouter.use((req, res, next) => authMiddleware.checkToken(req, res, next));

cartRouter.post('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (req.decoded.role != "admin" && req.decoded.userId != userId) {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const checkUserQuery = 'SELECT * FROM users WHERE user_id = $1';
        const checkUserResult = await pool.query(checkUserQuery, [userId]);
    
        if (checkUserResult.rows.length === 0) {
            res.status(404).json({ error: `User with id ${userId} not found` });
            return;
        }
    
        const createCartQuery = 'INSERT INTO cart (user_id) VALUES ($1) RETURNING cart_id';
        const createCartResult = await pool.query(createCartQuery, [userId]);
    
        const cartId = createCartResult.rows[0].cart_id;
    
        res.status(200).json({ cartId, userId, products: [] });
    } catch (error) {
        console.error('Error creating a cart for the user:', error);
        res.status(500).json({ error: 'Error creating a cart for the user' });
    }
});

cartRouter.put('/:cartId', async (req, res) => {
    try {
        const cartId = req.params.cartId;
        const requestData = req.body;
        let params = [cartId];

        const checkCartQuery = 'SELECT * FROM cart WHERE cart_id = $1';

        if (req.decoded.role != "admin") {
            checkCartQuery += ' AND user_id = $2';
            params.push(req.decoded.userId);
        }
        const checkCartResult = await pool.query(checkCartQuery, params);
        if (checkCartResult.rows.length === 0) {
            res.status(404).json({ error: `Cart with id ${cartId} not found` });
            return;
        }
    
        const productId = requestData.productId;
        const options = requestData.options;
    
        await addProductToCart(cartId, productId, options);
    
        const updatedCart = await getCartDetails(cartId);
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error adding product to the cart:', error);
        res.status(500).json({ error: error });
    }
});

cartRouter.get('/:cartId', async (req, res) => {
    try {
        const cartId = req.params.cartId;
        let params = [cartId];

        const checkCartQuery = 'SELECT * FROM cart WHERE cart_id = $1';

        if (req.decoded.role != "admin") {
            checkCartQuery += ' AND user_id = $2';
            params.push(req.decoded.userId);
        }
        const checkCartResult = await pool.query(checkCartQuery, params);
        if (checkCartResult.rows.length === 0) {
            res.status(404).json({ error: `Cart with id ${cartId} not found` });
            return;
        }

        const cartDetails = await getCartDetails(cartId);
    
        res.status(200).json({
            cartId: cartDetails.cartId,
            userId: cartDetails.userId,
            products: cartDetails.products,
          });
    } catch (error) {
        console.error('Error fetching cart details:', error);
        res.status(500).json({ error: 'Error fetching cart details' });
    }
});

cartRouter.delete('/:cartId', async (req, res) => {
    try {
        const cartId = req.params.cartId;
        let params = [cartId];

        const checkCartQuery = 'SELECT * FROM cart WHERE cart_id = $1';

        if (req.decoded.role != "admin") {
            checkCartQuery += ' AND user_id = $2';
            params.push(req.decoded.userId);
        }
        const checkCartResult = await pool.query(checkCartQuery, params);
        if (checkCartResult.rows.length === 0) {
            res.status(404).json({ error: `Cart with id ${cartId} not found` });
            return;
        }
        await deleteCartAndCartItems(cartId);
    
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting cart:', error);
        res.status(500).json({ error: 'Error deleting cart' });
    }
});

cartRouter.delete('/:cartId/buy', async (req, res) => {
    try {
        const cartId = req.params.cartId;
        let params = [cartId];

        const checkCartQuery = 'SELECT * FROM cart WHERE cart_id = $1';

        if (req.decoded.role != "admin") {
            checkCartQuery += ' AND user_id = $2';
            params.push(req.decoded.userId);
        }
        const checkCartResult = await pool.query(checkCartQuery, params);
        if (checkCartResult.rows.length === 0) {
            res.status(404).json({ error: `Cart with id ${cartId} not found` });
            return;
        }
    
        await buyCart(cartId);
    
        res.status(204).send();
    } catch (error) {
        console.error('Error buying cart:', error);
        res.status(500).json({ error: 'Error buying cart' });
    }
});
  
async function addProductToCart(cartId, productId, options) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      for (const color of Object.keys(options)) {
        for (const size of Object.keys(options[color])) {
          const amount = options[color][size];
          
          const result = await getProductOptionIdAndStock(productId, color, size);

          if (!result) {
            await client.query('ROLLBACK');
            throw new Error('Product option not found');
          }

          if (amount > result.stock) {
            await client.query('ROLLBACK');
            throw new Error(`Not enough stock of product ${productId} in color ${color}`);
          }

          await insertProductIntoCart(cartId, result.option_id, amount);
        }
      }
  
      await client.query('COMMIT');
    } finally {
      client.release();
    }
}
  
async function getProductOptionIdAndStock(productId, color, size) {
    const getProductOptionIdQuery = 'SELECT option_id, stock FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3';
    try {
        const result = await pool.query(getProductOptionIdQuery, [productId, color, size]);
    
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}
 
async function insertProductIntoCart(cartId, productOptionId, amount) {
    const checkExistingCartItemQuery = 'SELECT * FROM cart_item WHERE cart_id = $1 AND product_option_id = $2';
    const updateCartItemQuery = 'UPDATE cart_item SET amount = $1 WHERE cart_id = $2 AND product_option_id = $3';
    const insertCartItemQuery = 'INSERT INTO cart_item (cart_id, product_option_id, amount) VALUES ($1, $2, $3)';
  
    const client = await pool.connect();
  
    try {
        await client.query('BEGIN');
    
        const { rows } = await client.query(checkExistingCartItemQuery, [cartId, productOptionId]);
    
        if (rows.length > 0) {
            await client.query(updateCartItemQuery, [amount, cartId, productOptionId]);
        } else {
            await client.query(insertCartItemQuery, [cartId, productOptionId, amount]);
        }
  
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function getCartDetails(cartId) {
    const getCartQuery = `
      SELECT c.cart_id, c.user_id, p.product_id, po.color, po.size, ci.amount
      FROM cart c
      LEFT JOIN cart_item ci ON c.cart_id = ci.cart_id
      LEFT JOIN product_option po ON ci.product_option_id = po.option_id
      LEFT JOIN product p ON po.product_id = p.product_id
      WHERE c.cart_id = $1
    `;
  
    try {
        const { rows } = await pool.query(getCartQuery, [cartId]);
    
        if (rows.length === 0) {
            return null;
        }
    
        const cartDetails = {
            cartId: rows[0].cart_id,
            userId: rows[0].user_id,
            products: [],
        };
    
        const productMap = new Map(); 
    
        rows.forEach((row) => {
            const { product_id, product_name, color, size, amount } = row;
    
            if (!productMap.has(product_id)) {
            productMap.set(product_id, {
                productId: product_id,
                productName: product_name,
                options: {},
            });
            }
    
            const product = productMap.get(product_id);
            if (!product.options[color]) {
            product.options[color] = {};
            }
    
            product.options[color][size] = amount;
        });
    
        cartDetails.products = Array.from(productMap.values());
  
        return cartDetails;
    } catch (error) {
        throw error;
    }
  }

async function deleteCartAndCartItems(cartId) {
    const deleteCartQuery = 'DELETE FROM cart WHERE cart_id = $1';
    const deleteCartItemsQuery = 'DELETE FROM cart_item WHERE cart_id = $1';
  
    const client = await pool.connect();
  
    try {
        await client.query('BEGIN');
    
        await client.query(deleteCartItemsQuery, [cartId]);
    
        await client.query(deleteCartQuery, [cartId]);
    
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function buyCart(cartId) {
    const client = await pool.connect();
  
    try {
        await client.query('BEGIN');
    
        const cartProductQuery = 'SELECT product_option_id, amount FROM cart_item WHERE cart_id = $1';
        const results = await client.query(cartProductQuery, [cartId]);
        const updateStockQuery = 'UPDATE product_option SET stock = stock - $1 WHERE option_id = $2;'
        for (row in results) {
            
            await client.query(updateStockQuery, [row.amount, row.product_option_id]);
        }

        await deleteCartAndCartItems(cartId);
    
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = cartRouter;