const express = require('express');
const productRouter = express.Router();
const pool = require('../db');
const authMiddleware = require('../auth/authMiddleware'); 

productRouter.use((req, res, next) => authMiddleware.checkToken(req, res, next));

productRouter.get('/', async (req, res) => {
    try {
        let query = `
            SELECT p.product_id, p.price, pc.color, pc.size, pc.stock, c.description AS category
            FROM product_option pc
            JOIN product p ON pc.product_id = p.product_id
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE pc.stock > 0
        `;
    
        const { category, color, size, priceMin, priceMax } = req.query;
    
        const filterValues = [];
    
        if (category) {
            query += ' AND c.description = $' + (filterValues.length + 1);
            filterValues.push(category);
        }
    
        if (color) {
            query += ' AND pc.color = $' + (filterValues.length + 1);
            filterValues.push(color);
        }
    
        if (size) {
            query += ' AND pc.size = $' + (filterValues.length + 1);
            filterValues.push(size);
        }
    
        if (priceMin) {
            query += ' AND p.price >= $' + (filterValues.length + 1);
            filterValues.push(priceMin);
        }
    
        if (priceMax) {
            query += ' AND p.price <= $' + (filterValues.length + 1);
            filterValues.push(priceMax);
        }

        query += ' ORDER BY p.product_id, pc.color';
    
        const result = await pool.query(query, filterValues);
        
        res.status(200).json(formatProducts(result.rows));
    } catch (error) {
        console.error('Error listing products:', error);
        res.status(500).json({ error: 'Error listing products' });
    }
});

productRouter.get('/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
    
        const query = `
            SELECT p.product_id, p.price, pc.color, pc.size, pc.stock, c.description AS category
            FROM product p
            LEFT JOIN product_option pc ON pc.product_id = p.product_id
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE p.product_id = $1;
        `;
    
        const result = await pool.query(query, [productId]);
    
        if (result.rows.length === 0) {
            res.status(404).json({ error: `Product with id ${productId} not found` });
        } else {
            res.status(200).json(formatProducts(result.rows));
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Error fetching product' });
    }
});

productRouter.put('/:productId', async (req, res) => {
    try {

        if (req.decoded.userType != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const productId = req.params.productId;
        const { price, categories } = req.body;
    
        const checkQuery = 'SELECT * FROM product WHERE product_id = $1';
        const checkResult = await pool.query(checkQuery, [productId]);
    
        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: `Product with id ${productId} not found` });
            return;
        }
    
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            if (price) {
                const updateProductQuery = 'UPDATE product SET price = $1 WHERE product_id = $2 RETURNING *';
                const updateProductValues = [price, productId];
                const updateProductResult = await client.query(updateProductQuery, updateProductValues);
    
                if (updateProductResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    res.status(500).json({ error: 'Error updating product' });
                    return;
                }
            }
    
            if (categories) {
                const deleteCategoriesQuery = 'DELETE FROM product_category WHERE product_id = $1';
                await client.query(deleteCategoriesQuery, [productId]);
        
                
                for (const category of categories) {
                    const insertCategoryQuery = 'INSERT INTO category (description) VALUES ($1) ON CONFLICT (description) DO NOTHING';
                    await client.query(insertCategoryQuery, [category]);

                    const selectCategoryQuery = 'SELECT category_id FROM category WHERE description = $1';
                    const categoryResult = await client.query(selectCategoryQuery, [category]);

                    const insertProductCategoryQuery = 'INSERT INTO product_category (product_id, category_id) VALUES ($1, $2)';
                    const insertProductCategoryValues = [productId, categoryResult.rows[0].category_id];
                    await client.query(insertProductCategoryQuery, insertProductCategoryValues);
                }
                
            }
            await client.query('COMMIT');
    
            res.status(200).json({ message: 'Product updated successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating product and categories:', error);
            res.status(500).json({ error: 'Error updating product and categories' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
});

productRouter.post('/', async (req, res) => {
    try {

        if (req.decoded.userType != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const { category, price } = req.body;
    
        if (!category || !Array.isArray(category) || category.length === 0 || !price) {
            res.status(400).json({ error: 'Category and price are required properties' });
            return;
        }
    
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            const createProductQuery = 'INSERT INTO product (price) VALUES ($1) RETURNING product_id';
            const createProductValues = [price];
            const createProductResult = await client.query(createProductQuery, createProductValues);
            const productId = createProductResult.rows[0].product_id;
    
            for (const categoryDescription of category) {
                const insertCategoryQuery = 'INSERT INTO category (description) VALUES ($1) ON CONFLICT (description) DO NOTHING';
                await client.query(insertCategoryQuery, [categoryDescription]);
        
                const linkProductCategoryQuery = 'INSERT INTO product_category (product_id, category_id) SELECT $1, category_id FROM category WHERE description = $2';
                await client.query(linkProductCategoryQuery, [productId, categoryDescription]);
            }
    
            await client.query('COMMIT');
            
            const query = `
            SELECT p.product_id, p.price, c.description AS category
            FROM product p 
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE p.product_id = $1;
            `;
    
            const result = await pool.query(query, [productId]);
            res.status(201).json(formatProducts(result.rows));

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating product and categories:', error);
            res.status(500).json({ error: 'Error creating product and categories' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Error creating product' });
    }
});

productRouter.delete('/:productId', async (req, res) => {
    try {

        if (req.decoded.userType != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const productId = req.params.productId;
    
        const checkQuery = 'SELECT * FROM product WHERE product_id = $1';
        const checkResult = await pool.query(checkQuery, [productId]);
    
        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: `Product with id ${productId} not found` });
            return;
        }
    
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            const deleteProductCategoryQuery = 'DELETE FROM product_category WHERE product_id = $1';
            await client.query(deleteProductCategoryQuery, [productId]);
    
            const deleteCartItemQuery = 'DELETE FROM cart_item WHERE product_option_id IN (SELECT option_id FROM product_option WHERE product_id = $1)';
            await client.query(deleteCartItemQuery, [productId]);

            const deleteProductOptionQuery = 'DELETE FROM product_option WHERE product_id = $1';
            await client.query(deleteProductOptionQuery, [productId]);
    
            const deleteProductQuery = 'DELETE FROM product WHERE product_id = $1';
            await client.query(deleteProductQuery, [productId]);
    
            await client.query('COMMIT');
    
            res.status(200).json({ message: 'Product and associated entries deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting product and associated entries:', error);
            res.status(500).json({ error: 'Error deleting product and associated entries' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
});

productRouter.post('/:productId/options', async (req, res) => {
    try {

        if (req.decoded.userType != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const productId = req.params.productId;
        const options = req.body;
    
        const checkProductQuery = 'SELECT * FROM product WHERE product_id = $1';
        const checkProductResult = await pool.query(checkProductQuery, [productId]);
    
        if (checkProductResult.rows.length === 0) {
            res.status(404).json({ error: `Product with id ${productId} not found` });
            return;
        }
    
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            for (const color in options) {

                for (const size in options[color]) {
                    
                    const stock = options[color][size];
    
                    const checkOptionQuery = 'SELECT * FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3';
                    const checkOptionResult = await client.query(checkOptionQuery, [productId, color, size]);
    
                    if (checkOptionResult.rows.length === 0) {
                        const insertOptionQuery = 'INSERT INTO product_option (product_id, color, size, stock) VALUES ($1, $2, $3, $4)';
                        await client.query(insertOptionQuery, [productId, color, size, stock]);
                    } else {
                        
                        const existingStock = checkOptionResult.rows[0].stock;
                        const newStock = existingStock + stock;
        
                        const updateStockQuery = 'UPDATE product_option SET stock = $1 WHERE product_id = $2 AND color = $3 AND size = $4';
                        await client.query(updateStockQuery, [newStock, productId, color, size]);
                    } 
                } 
            }
    
            await client.query('COMMIT');
            
            const query = `
            SELECT p.product_id, p.price, pc.color, pc.size, pc.stock, c.description AS category
            FROM product_option pc
            JOIN product p ON pc.product_id = p.product_id
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE pc.product_id = $1;
            `;
    
            const result = await pool.query(query, [productId]);

            res.status(200).json(formatProducts(result.rows));
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error adding options to the product:', error);
            res.status(500).json({ error: 'Error adding options to the product' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error adding options to the product:', error);
        res.status(500).json({ error: 'Error adding options to the product' });
    }
});

productRouter.delete('/:productId/options/:color', async (req, res) => {
    try {

        if (req.decoded.userType != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const productId = req.params.productId;
        const color = req.params.color;
        const size = req.query.size;
    
        const checkProductQuery = 'SELECT * FROM product WHERE product_id = $1';
        const checkProductResult = await pool.query(checkProductQuery, [productId]);
    
        if (checkProductResult.rows.length === 0) {
            res.status(404).json({ error: `Product with id ${productId} not found` });
            return;
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            if (size) {
                const deleteSizeQuery = 'DELETE FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3 RETURNING *';
                const deleteSizeResult = await client.query(deleteSizeQuery, [productId, color, size]);
    
                if (deleteSizeResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    res.status(404).json({ error: 'Option size not found or option removed' });
                    return;
                }
            } else {
                const deleteOptionQuery = 'DELETE FROM product_option WHERE product_id = $1 AND color = $2';
                await client.query(deleteOptionQuery, [productId, color]);
            }
    
            await client.query('COMMIT');
    
            res.status(200).json({ message: 'Option deleted from the product successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting option from the product:', error);
            res.status(500).json({ error: 'Error deleting option from the product' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting option from the product:', error);
        res.status(500).json({ error: 'Error deleting option from the product' });
    }
});

const formatProducts = (products) => {
    let result = new Map();

    products.forEach(product => {
        formatted = {};

        if (result.has(product.product_id)){ 
            formatted = result.get(product.product_id);
        } else {
            formatted = {
                product_id: product.product_id,
                category: [],
                price: product.price,
                options: {}
            };
        }

        if (!formatted.category.includes(product.category)) {
            formatted.category.push(product.category);
        }
        
        if (product.color){
            if (!formatted.options[product.color]){
                formatted.options[product.color] = {};
            }
            formatted.options[product.color][product.size] = product.stock;
        }
        result.set(product.product_id, formatted);
    });

    return Array.from(result.values());
}

module.exports = productRouter;