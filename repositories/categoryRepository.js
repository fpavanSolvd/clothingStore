const pool = require('../database/db');

module.exports.getAll = async () => {
    const query = 'SELECT category_id, description FROM category';
    try {
        const result = await pool.query(query, []);
        return result.rows;
    } catch (error) {
        throw new Error('Error fetching categories');
    }
}

module.exports.getById = async (category_id) => {
    const query = 'SELECT category_id, description FROM category WHERE category_id = $1';
    try {
        const result = await pool.query(query, [category_id]);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error fetching category');
    }
}

module.exports.getByDescription = async (description) => {
    const query = 'SELECT category_id, description FROM category WHERE description = $1';
    try {
        const result = await pool.query(query, [description]);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error fetching category');
    }
}

module.exports.create = async (description) => {
    const query = 'INSERT INTO category (description) VALUES ($1) RETURNING (category_id, description)';
    try {
        const result = await pool.query(query, [description]);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error creating category');
    }
}

module.exports.delete = async (categoryId) => {
    const client = await pool.connect();
    const queryProductCategory = 'DELETE FROM product_category WHERE category_id = $1';
    const queryCategory = 'DELETE FROM category WHERE category_id = $1';
    
    try {
        await client.query('BEGIN');

        await pool.query(queryProductCategory, [categoryId]);
        await pool.query(queryCategory, [categoryId]);
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error deleting category');
    } finally {
        client.release();
    }
}