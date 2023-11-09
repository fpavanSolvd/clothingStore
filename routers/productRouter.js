const express = require('express');
const authMiddleware = require('../auth/authMiddleware'); 
const productController = require('../controllers/productController');

const productRouter = express.Router();
productRouter.use((req, res, next) => authMiddleware.checkToken(req, res, next));

productRouter.get('/', productController.getProducts);

productRouter.get('/:productId', productController.getProduct);

productRouter.put('/:productId', productController.updateProduct);

productRouter.post('/', productController.createProduct);

productRouter.delete('/:productId', productController.deleteProduct);

productRouter.post('/:productId/options', productController.createOption);

productRouter.delete('/:productId/options/:color', productController.deleteOption);


module.exports = productRouter;