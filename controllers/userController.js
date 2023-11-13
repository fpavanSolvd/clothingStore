
const jwt = require('../auth/jwt');
const userRepository = require('../repositories/userRepository');
let config = require('../config'); 

module.exports.getUsers = async (req, res) => {
	try {

		if (req.decoded.role !== 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const users = await userRepository.getAll(req.query.role);
  
		res.status(200).json(users);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error fetching users' });
	}
};

module.exports.getUser = async (req, res) => {
	try {

		const userId = req.params.userId;
    
		if (req.decoded.role !== 'admin' && req.decoded.userId !== userId) {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const user = await userRepository.getById(userId);
        
		if (!user) {
			res.status(404).json({ error: `User with id ${userId} not found` });
		} else {
			res.status(200).json(user);
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error fetching user' });
	} 
};

module.exports.updateUser = async (req, res) => {
	try {
		const userId = req.params.userId;

		if (req.decoded.role !== 'admin' && req.decoded.userId !== userId) {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const { name, email, password } = req.body;
    
		if (!name && !email && !password) {
			res.status(400).json({ error: 'No valid updates provided' });
			return;
		}
    
		const updated = await userRepository.updateUser(userId, name, email, password);

		if (!updated) {
			res.status(404).json({ error: `User with id ${userId} not found` });
		} else {
			res.status(200).json('User updated succesfully');
		}

	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error updating user' });
	}
};

module.exports.registerUser = async (req, res) => {
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
        
		const user = await userRepository.getByEmail(email);

		if (user) {
			res.status(400).json({ error: `Email ${email} already exists` });
			return;
		}
  
		const newUser = await userRepository.insertUser(name, email, password, role);
  
		res.status(201).json(newUser);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error creating user' });
	}
};

module.exports.login = async (req, res) => {
	try {
		const { iss, sub, email, password } = req.body;
    
		if (!iss || !sub || !email || !password) {
			res.status(400).json({ error: 'Request must include email and password along with jwt payload requirements: sub and iss' });
			return;
		}

		const user = await userRepository.getByEmailAndPassword(email, password);
    
		if (!user) {
			res.status(401).json({ error: 'Incorrect email or password' });
			return;
		}
        
		const payload = {
			iss: iss,
			sub: sub,
			email: email,
			userId: user.user_id,
			role: user.role
		};
    
		const token = jwt(config.secret).encode(payload);
    
		res.status(200).json({ token });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error logging in' });
	} 
};

module.exports.deleteUser = async (req, res) => {
	try {
		const userId = req.params.userId;
    
		if (req.decoded.role !== 'admin' && req.decoded.userId !== userId) {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}
    
		const user = await userRepository.getById(userId);

		if (!user) {
			res.status(404).json({ error: `User with id ${userId} not found` });
			return;
		}
    
		await userRepository.deleteUser(userId);
    
		res.status(204).json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error deleting user' });
	}
};