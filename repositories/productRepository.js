const pool = require('../database/db');

module.exports.getAll = async (filters) => {

    const { category, color, size, priceMin, priceMax } = filters;

    let query = `
            SELECT p.product_id, p.price, pc.color, pc.size, pc.stock, c.description AS category
            FROM product_option pc
            JOIN product p ON pc.product_id = p.product_id
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE pc.stock > 0
        `;

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

        try {
            const result = await pool.query(query, filterValues);
            return result.rows;
        } catch {
            throw new Error('Error getting products');
        }
}

module.exports.getById = async (productId) => {
    const query = `
            SELECT p.product_id, p.price, pc.color, pc.size, pc.stock, c.description AS category
            FROM product p
            LEFT JOIN product_option pc ON pc.product_id = p.product_id
            JOIN product_category pcateg ON p.product_id = pcateg.product_id
            JOIN category c ON pcateg.category_id = c.category_id
            WHERE p.product_id = $1;
        `;

    try {
        const result = await pool.query(query, [productId]);
        return result.rows;
    } catch (error) {
        throw new Error('Error getting product');
    }
}

module.exports.update = async (productId, properties) => {

    const { price, categories } = properties;
    const client = await pool.connect();
    try {
        
        await client.query('BEGIN');

        if (price) {
            const updateProductQuery = 'UPDATE product SET price = $1 WHERE product_id = $2 RETURNING (product_id, price)';
            const updateProductValues = [price, productId];
            const updateProductResult = await client.query(updateProductQuery, updateProductValues);

            if (updateProductResult.rows.length === 0) {
                await client.query('ROLLBACK');
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

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error updating product and categories');
    } finally {
        client.release();
    }
}

module.exports.create = async (category, price) => {

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
        return result.rows;

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error creating product and categories:');
    } finally {
        client.release();
    }
}

module.exports.delete = async (productId) => {

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

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error deleting product and associated entries');
    } finally {
        client.release();
    }
}