const productRepository = require('../repositories/productRepository');
const productOptionRepository = require('../repositories/productOptionRepository');

module.exports.getProducts = async (req, res) => {
	try {
        
		const products = await productRepository.getAll(req.query);
  
		res.status(200).json(this.formatProducts(products));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error listing products' });
	}
};

module.exports.getProduct = async (req, res) => {
	try {
		const productId = req.params.productId;
    
		const product = await productRepository.getById(productId);
    
		if (product.length === 0) {
			res.status(404).json({ error: `Product with id ${productId} not found` });
		} else {
			res.status(200).json(this.formatProducts(product));
		}
	} catch (error) {
		console.error('Error fetching product:', error);
		res.status(500).json({ error: 'Error fetching product' });
	}
};

module.exports.updateProduct = async (req, res) => {
	try {

		if (req.decoded.role != 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const productId = req.params.productId;
    
		const product = await productRepository.getById(productId);
    
		if (product.length === 0) {
			res.status(404).json({ error: `Product with id ${productId} not found` });
			return;
		}
    
		await productRepository.update(productId, req.body);
        
		res.status(200).json({ message: 'Product updated successfully' });
        
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error updating product' });
	}
};

module.exports.createProduct = async (req, res) => {
	try {

		if (req.decoded.role != 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const { category, price } = req.body;
    
		if (!category || !Array.isArray(category) || category.length === 0 || !price) {
			res.status(400).json({ error: 'Category and price are required properties' });
			return;
		}
		const product = await productRepository.create(category, price);
		res.status(201).json(this.formatProducts(product));

	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error creating product' });
	}
};

module.exports.deleteProduct = async (req, res) => {
	try {

		if (req.decoded.role != 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const productId = req.params.productId;
    
		const product = await productRepository.getById(productId);
    
		if (product.length === 0) {
			res.status(404).json({ error: `Product with id ${productId} not found` });
			return;
		}
    
		await productRepository.delete(productId);
		res.status(200).json({ message: 'Product and associated entries deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error deleting product' });
	}
};

module.exports.createOption = async (req, res) => {
	try {

		if (req.decoded.role != 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const productId = req.params.productId;
		const options = req.body;
    
		const product = await productRepository.getById(productId);
		if (product.length === 0) {
			res.status(404).json({ error: `Product with id ${productId} not found` });
			return;
		}
    
		await productOptionRepository.create(productId, options);
		const updatedProduct = await productRepository.getById(productId);

		res.status(200).json(this.formatProducts(updatedProduct));

	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error adding options to the product' });
	}
};

module.exports.deleteOption = async (req, res) => {
	try {

		if (req.decoded.role != 'admin') {
			res.status(403).json({ error: 'Access denied. You are not an admin.' });
			return;
		}

		const productId = req.params.productId;
		const color = req.params.color;
		const size = req.query.size;
    
		const product = await productRepository.getById(productId);
    
		if (product.length === 0) {
			res.status(404).json({ error: `Product with id ${productId} not found` });
			return;
		}
        
		await productOptionRepository.delete(productId, color, size);
		res.status(200).json({ message: 'Option deleted from the product successfully' });

	} catch (error) {
		console.error('Error deleting option from the product:', error);
		res.status(500).json({ error: 'Error deleting option from the product' });
	}
};

module.exports.formatProducts = (products) => {
	let result = new Map();

	if (!Array.isArray(products)) {
		products = [products];
	}

	products.forEach(product => {
		let formatted = {};

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
};