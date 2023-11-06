const express = require('express');
const pool = require('../database/db');
const jwt = require('../auth/jwt');
const authMiddleware = require('../auth/authMiddleware');
let config = require('../config'); 

const userRouter = express.Router();

userRouter.use((req, res, next) => {
    const excludedRoutes = ['/login', '/register'];
  
    if (!excludedRoutes.includes(req.path)) {
        authMiddleware.checkToken(req, res, next);
    } else {
        next();
    }
});

userRouter.get('/', async (req, res) => {
    try {

        if (req.decoded.role != "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const role = req.query.role;
  
        let query = 'SELECT user_id, name, email, role FROM users';
        const values = [];
  
        if (role) {
            query += ' WHERE role = $1';
            values.push(role);
        }
  
        const result = await pool.query(query, values);
  
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

userRouter.get('/:userId', async (req, res) => {
    try {

        const userId = req.params.userId;
    
        if (req.decoded.role != "admin" && req.decoded.userId != userId) {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const query = 'SELECT user_id, name, email, role FROM users WHERE user_id = $1';
        const values = [userId];
    
        const result = await pool.query(query, values);
  
        if (result.rows.length === 0) {
            res.status(404).json({ error: `User with id ${userId} not found` });
        } else {
            res.status(200).json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

userRouter.put('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.decoded.role != "admin" && req.decoded.userId != userId) {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const { name, email, password } = req.body;
    
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
    
        if (updates.length === 0) {
            res.status(400).json({ error: 'No valid updates provided' });
            return;
        }
    
        query += ' ' + updates.join(', ') + ` WHERE user_id = $${values.length + 1}`;
        values.push(userId);
    
        const result = await pool.query(query, values);
    
        if (result.rowCount === 0) {
            res.status(404).json({ error: `User with id ${userId} not found` });
        } else {
            res.status(200).json('User updated succesfully');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error updating user' });
    }
});

userRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
  
        if (!name || !email || !password || !role) {
            res.status(400).json({ error: 'All required fields must be provided' });
            return;
        }

        if (role !== 'admin' && role !== 'customer') {
            res.status(400).json({ error: 'role must be admin or customer' });
            return;
        }
  
        const checkEmailQuery = 'SELECT * FROM users WHERE email = $1';
        const emailCheckResult = await pool.query(checkEmailQuery, [email]);
  
        if (emailCheckResult.rows.length > 0) {
            res.status(400).json({ error: `Email ${email} already exists` });
            return;
        }
  
        const insertQuery = 'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
        const insertValues = [name, email, password, role];
        const result = await pool.query(insertQuery, insertValues);
  
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

userRouter.post('/login', async (req, res) => {
    try {
        const { iss, sub, email, password } = req.body;
    
        if (!iss || !sub || !email || !password) {
            res.status(400).json({ error: 'Request must include email and password along with jwt payload requirements: sub and iss' });
            return;
        }
    
        const query = 'SELECT * FROM users WHERE email = $1 AND password = $2';
        const values = [email, password];
    
        const result = await pool.query(query, values);
    
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Incorrect email or password' });
            return;
        }
        
        const payload = {
            iss: iss,
            sub: sub,
            email: email,
            userId: result.rows[0].user_id,
            role: result.rows[0].role
        };
    
        const token = jwt(config.secret).encode(payload);
    
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

userRouter.delete('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
    
        if (req.decoded.role != "admin" && req.decoded.userId != userId) {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const checkQuery = 'SELECT * FROM users WHERE user_id = $1';
        const checkValues = [userId];
    
        const checkResult = await pool.query(checkQuery, checkValues);
    
        if (checkResult.rows.length === 0) {
            res.status(404).json({ error: `User with id ${userId} not found` });
            return;
        }
    
        const deleteQuery = 'DELETE FROM users WHERE user_id = $1';
        const deleteValues = [userId];
    
        await pool.query(deleteQuery, deleteValues);
    
        res.status(204).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});
  
module.exports = userRouter;