const pool = require('../database/db');

module.exports.getAll = async (role) => {
    let query = 'SELECT user_id, name, email, role FROM users';
    const values = [];
  
    if (role) {
        query += ' WHERE role = $1';
        values.push(role);
    }
    
    try {
        const result = await pool.query(query, values);

        return result.rows;
    } catch {
        throw new Error('Error fetching users');
    }
}

module.exports.getById = async (userId) => {
    const query = 'SELECT user_id, name, email, role FROM users WHERE user_id = $1';
    const values = [userId];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch {
        throw new Error('Error fetching user');
    }
}

module.exports.getByEmail = async (email) => {

    const checkEmailQuery = 'SELECT user_id, name, email, role FROM users WHERE email = $1';
    
    try {
        const result = await pool.query(checkEmailQuery, [email]);
        return result.rows[0];
    } catch {
        throw new Error('Error fetching user');
    }
}

module.exports.getByEmailAndPassword = async (email, password) => {

    const query = 'SELECT user_id, name, email, role FROM users WHERE email = $1 AND password = $2';
    const values = [email, password];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch {
        throw new Error('Error fetching user');  
    }
}

module.exports.updateUser = async (userId, name, email, password) => {

    let query = 'UPDATE users SET';

    const values = [];
    const updates = [];

    if (name) {
        updates.push(`name = $${values.length + 1}`);
        values.push(name);
    }

    if (email) {
        updates.push(`email = $${values.length + 1}`);
        values.push(email);
    }

    if (password) {
        updates.push(`password = $${values.length + 1}`);
        values.push(password);
    }

    query += ' ' + updates.join(', ') + ` WHERE user_id = $${values.length + 1}`;
    values.push(userId);

    try {
        const result = await pool.query(query, values);
        return result.rowCount;
    } catch (error) {
        throw new Error('Error updating user');
    }
}

module.exports.insertUser = async (name, email, password, role) => {
    const insertQuery = 'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING (user_id, name, email, password, role)';
    const insertValues = [name, email, password, role];
    try {
        const result = await pool.query(insertQuery, insertValues);
        return result.rows[0];
    } catch {
        throw new Error('Error creating user');
    }
}

module.exports.deleteUser = async (userId) => {
    const deleteQuery = 'DELETE FROM users WHERE user_id = $1';
    const deleteValues = [userId];

    try {
        await pool.query(deleteQuery, deleteValues);
    } catch {
        throw new Error('Error deleting user');
    }
}