const pool = require('../database/db');

module.exports.create = async (productId, options) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const color in options) {

            for (const size in options[color]) {
                
                const stock = options[color][size];

                const checkOptionQuery = 'SELECT option_id, product_id, color, size, stock FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3';
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
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error adding options to the product');
    } finally {
        client.release();
    }
}

module.exports.delete = async (productId, color, size) => {

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (size) {
            const deleteSizeQuery = 'DELETE FROM product_option WHERE product_id = $1 AND color = $2 AND size = $3 RETURNING (option_id, product_id, color, size, stock)';
            const deleteSizeResult = await client.query(deleteSizeQuery, [productId, color, size]);

            if (deleteSizeResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return;
            }
        } else {
            const deleteOptionQuery = 'DELETE FROM product_option WHERE product_id = $1 AND color = $2';
            await client.query(deleteOptionQuery, [productId, color]);
        }

        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error('Error deleting option from the product');
    } finally {
        client.release();
    }
}