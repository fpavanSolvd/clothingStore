const pool = require('../database/db');

module.exports.create = async (userId) => {

	const createCartQuery = 'INSERT INTO cart (user_id) VALUES ($1) RETURNING cart_id';
	try {
		const createCartResult = await pool.query(createCartQuery, [userId]);
		const cartId = createCartResult.rows[0].cart_id;
		return cartId;
	} catch (error) {
		throw new Error('Error creating a cart');
	}
};

module.exports.getById = async (cartId, role, userId) => {
	let checkCartQuery = 'SELECT cart_id, user_id FROM cart WHERE cart_id = $1';
	let params = [cartId];

	if (role !== 'admin') {
		checkCartQuery += ' AND user_id = $2';
		params.push(userId);
	}
	try {
		const checkCartResult = await pool.query(checkCartQuery, params);
		return checkCartResult.rows[0];
	} catch (error) {
		throw new Error('Error getting cart');
	}
};

module.exports.addProduct = async (cartId, productId, options) => {
    
	const client = await pool.connect();

	try {
		await client.query('BEGIN');
  
		for (const color of Object.keys(options)) {
			for (const size of Object.keys(options[color])) {
				const amount = options[color][size];
                
				const result = await this.getProductOptionIdAndStock(productId, color, size);

				if (!result) {
					await client.query('ROLLBACK');
					throw new Error('Product option not found');
				}

				if (amount > result.stock) {
					await client.query('ROLLBACK');
					throw new Error(`Not enough stock of product ${productId} in color ${color}`);
				}

				await this.insertProductIntoCart(cartId, result.option_id, amount);
			}
		}
		await client.query('COMMIT');
	} finally {
		client.release();
	}
};

module.exports.getProductOptionIdAndStock = async (productId, color, size) => {
	const getProductOptionIdQuery = 'SELECT option_id, stock FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3';
	try {
		const result = await pool.query(getProductOptionIdQuery, [productId, color, size]);
    
		if (result.rows.length === 0) {
			return null;
		}
		return result.rows[0];
	} catch (error) {
		throw new Error('Error getting option and stock');
	}
};

module.exports.insertProductIntoCart = async (cartId, productOptionId, amount) => {
    
	const checkExistingCartItemQuery = 'SELECT cart_item_id, cart_id, product_option_id, amount FROM cart_item WHERE cart_id = $1 AND product_option_id = $2';
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
		throw new Error('Error inserting product into cart');
	} finally {
		client.release();
	}
};

module.exports.getWithItems = async (cartId) => {
    
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
		throw new Error('Error getting cart and items');
	}
};

module.exports.delete = async (cartId) => {

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
		throw new Error('Error deleting cart');
	} finally {
		client.release();
	}
};

module.exports.buy = async (cartId) => {
	const client = await pool.connect();
  
	try {
		await client.query('BEGIN');
    
		const cartProductQuery = 'SELECT product_option_id, amount FROM cart_item WHERE cart_id = $1';
		const results = await client.query(cartProductQuery, [cartId]);
		const updateStockQuery = 'UPDATE product_option SET stock = stock - $1 WHERE option_id = $2;';
        
		results.rows.forEach(async (row) =>  {
			await client.query(updateStockQuery, [row.amount, row.product_option_id]);
		});

		await this.delete(cartId);
    
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw new Error('Error buying cart');
	} finally {
		client.release();
	}
};