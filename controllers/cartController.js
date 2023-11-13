const cartRepository = require('../repositories/cartRepository');
const userRepository = require('../repositories/userRepository');

module.exports.createCart = async (req, res) => {
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
    
		const cartId = await cartRepository.create(userId);
    
		res.status(200).json({ cartId, userId, products: [] });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error creating a cart for the user' });
	}
};

module.exports.updateCart = async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const requestData = req.body;

		const cart = await cartRepository.getById(cartId, req.decoded.role, req.decoded.userId);

		if (!cart) {
			res.status(404).json({ error: `Cart with id ${cartId} not found` });
			return;
		}
    
		const productId = requestData.productId;
		const options = requestData.options;
    
		await cartRepository.addProduct(cartId, productId, options);
    
		const updatedCart = await cartRepository.getWithItems(cartId);
		res.status(200).json(updatedCart);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error adding products to cart' });
	}
};

module.exports.getCart = async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const cart = await cartRepository.getById(cartId, req.decoded.role, req.decoded.userId);

		if (!cart) {
			res.status(404).json({ error: `Cart with id ${cartId} not found` });
			return;
		}

		const cartDetails = await cartRepository.getWithItems(cartId);
    
		res.status(200).json({
			cartId: cartDetails.cartId,
			userId: cartDetails.userId,
			products: cartDetails.products,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error fetching cart details' });
	}
};

module.exports.deleteCart = async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const cart = await cartRepository.getById(cartId, req.decoded.role, req.decoded.userId);

		if (!cart) {
			res.status(404).json({ error: `Cart with id ${cartId} not found` });
			return;
		}
		await cartRepository.delete(cartId);
    
		res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error deleting cart' });
	}
};

module.exports.buyCart = async (req, res) => {
	try {
		const cartId = req.params.cartId;
		const cart = await cartRepository.getById(cartId, req.decoded.role, req.decoded.userId);

		if (!cart) {
			res.status(404).json({ error: `Cart with id ${cartId} not found` });
			return;
		}
    
		await cartRepository.buy(cartId);
    
		res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error buying cart' });
	}
};
